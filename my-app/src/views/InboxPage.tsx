"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Send,
  ArrowLeft,
  Trash2,
  Inbox,
  MessageCircle,
  Flag,
  Ban,
  Smile,
} from "lucide-react";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import { useDialog } from "../hooks/useDialog";

// Define predefined emoji reactions
const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "👏"];

// Helper function to parse @mentions and create links
const parseMessageWithMentions = (content: string, isOwnMessage: boolean) => {
  const parts = content.split(/(@\w+)/g);

  return parts.map((part, index) => {
    if (part.startsWith("@")) {
      const username = part.slice(1);
      return (
        <a
          key={index}
          href={`/${username}`}
          className={`font-semibold hover:underline ${
            isOwnMessage
              ? "text-blue-300 hover:text-blue-200"
              : "text-blue-600 hover:text-blue-800"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export default function InboxPage() {
  const { user: authUser, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedConversationId = searchParams.get("conversation") as Id<"dmConversations"> | null;
  const { showMessage, showConfirm, DialogComponents } = useDialog();

  // Queries
  const currentUser = useQuery(api.users.getMyUserDocument);
  const conversations = useQuery(
    api.dm.listConversations,
    isLoaded ? {} : "skip",
  );
  const messages = useQuery(
    api.dm.listMessages,
    selectedConversationId
      ? { conversationId: selectedConversationId }
      : "skip",
  );
  // Fallback query to get conversation details if not in list yet
  const fallbackConversation = useQuery(
    api.dm.getConversation,
    selectedConversationId
      ? { conversationId: selectedConversationId }
      : "skip",
  );

  // Get selected conversation details (from list or fallback query) - needed for isUserBlocked check
  const selectedConversation =
    conversations?.find((c) => c._id === selectedConversationId) ||
    fallbackConversation;

  // Check if current user has blocked the other user (must be before any returns)
  const isUserBlockedQuery = useQuery(
    api.dm.isUserBlocked,
    selectedConversation?.otherUser._id
      ? { userId: selectedConversation.otherUser._id }
      : "skip",
  );

  // Emoji theme query (always use default)
  const userEmojiTheme = "default";

  // Mutations
  const sendMessageMutation = useMutation(api.dm.sendMessage);
  const deleteConversationMutation = useMutation(api.dm.deleteConversation);
  const markConversationReadMutation = useMutation(api.dm.markConversationRead);
  const markAllAsReadMutation = useMutation(api.dm.markAllConversationsRead);
  const clearInboxMutation = useMutation(api.dm.clearInbox);
  const reportMutation = useMutation(api.dm.reportMessageOrUser);
  const blockUserMutation = useMutation(api.dm.blockUser);
  const unblockUserMutation = useMutation(api.dm.unblockUser);
  const addReactionMutation = useMutation(api.dmReactions.addOrUpdateReaction);
  const removeReactionMutation = useMutation(api.dmReactions.removeReaction);

  // Local state
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearingInbox, setIsClearingInbox] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reaction picker state
  const [showReactionPicker, setShowReactionPicker] =
    useState<Id<"dmMessages"> | null>(null);
  const [hoveredMessage, setHoveredMessage] = useState<Id<"dmMessages"> | null>(
    null,
  );

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [messages]);

  // Scroll to bottom when conversation is selected
  useEffect(() => {
    if (selectedConversationId && messages) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "auto",
          block: "end",
        });
      }, 100);
    }
  }, [selectedConversationId]);

  // Mark conversation as read when viewing
  useEffect(() => {
    if (selectedConversationId && isLoaded && authUser) {
      markConversationReadMutation({ conversationId: selectedConversationId });
    }
  }, [selectedConversationId, isLoaded, authUser]);

  // Mark all conversations as read when visiting inbox page
  useEffect(() => {
    if (isLoaded && authUser) {
      markAllAsReadMutation();
    }
  }, [isLoaded, authUser, markAllAsReadMutation]);

  // Clear selection if the conversation no longer exists (e.g., after deletion)
  useEffect(() => {
    if (
      selectedConversationId &&
      conversations &&
      !conversations.find((c) => c._id === selectedConversationId) &&
      fallbackConversation === null
    ) {
      router.push("/inbox");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, selectedConversationId, fallbackConversation]);

  // Handle message send
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversationId || isSending) return;

    setIsSending(true);
    setErrorMessage(null);
    try {
      await sendMessageMutation({
        conversationId: selectedConversationId,
        content: messageInput.trim(),
      });
      setMessageInput("");
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // Handle Shift+Enter to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  // Handle delete conversation
  const handleDeleteConversation = async () => {
    if (!selectedConversationId || isDeleting) return;

    showConfirm(
      "Delete Conversation",
      "Delete this conversation? Messages will be removed from your view.",
      async () => {
        setIsDeleting(true);
        const conversationToDelete = selectedConversationId;
        try {
          await deleteConversationMutation({
            conversationId: conversationToDelete,
          });
          // Clear the URL parameter and navigate to inbox without selection
          router.push("/inbox");
        } catch (error: any) {
          showMessage(
            "Error",
            error.message || "Failed to delete conversation",
            "error",
          );
        } finally {
          setIsDeleting(false);
        }
      },
      {
        confirmButtonText: "Delete",
        confirmButtonVariant: "destructive",
      },
    );
  };

  // Handle clear inbox
  const handleClearInbox = async () => {
    showConfirm(
      "Clear Inbox",
      "Clear entire inbox? All conversations will be removed from your view.",
      async () => {
        setIsClearingInbox(true);
        try {
          const result = await clearInboxMutation({});
          showMessage(
            "Success",
            `Cleared ${result.deletedCount} conversations`,
            "success",
          );
        } catch (error: any) {
          showMessage(
            "Error",
            error.message || "Failed to clear inbox",
            "error",
          );
        } finally {
          setIsClearingInbox(false);
        }
      },
      {
        confirmButtonText: "Clear Inbox",
        confirmButtonVariant: "destructive",
      },
    );
  };

  // Handle report user - open modal
  const handleReportUser = () => {
    if (!selectedConversationId || !selectedConversation || isReporting) return;
    setShowReportModal(true);
    setReportReason("");
  };

  // Submit report
  const submitReport = async () => {
    if (
      !selectedConversationId ||
      !selectedConversation ||
      !reportReason.trim()
    )
      return;

    setIsReporting(true);
    try {
      await reportMutation({
        reportedUserId: selectedConversation.otherUser._id,
        conversationId: selectedConversationId,
        reason: reportReason.trim(),
      });
      setShowReportModal(false);
      setReportReason("");
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to submit report");
    } finally {
      setIsReporting(false);
    }
  };

  // Handle block user - open modal
  const handleBlockUser = () => {
    if (!selectedConversation || isBlocking) return;
    setShowBlockModal(true);
  };

  // Confirm block/unblock
  const confirmBlockAction = async () => {
    if (!selectedConversation) return;

    const isCurrentlyBlocked = isUserBlockedQuery || false;

    setIsBlocking(true);
    try {
      if (isCurrentlyBlocked) {
        await unblockUserMutation({
          blockedUserId: selectedConversation.otherUser._id,
        });
      } else {
        await blockUserMutation({
          blockedUserId: selectedConversation.otherUser._id,
        });
      }
      setShowBlockModal(false);
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to update block status");
    } finally {
      setIsBlocking(false);
    }
  };

  // Handle emoji reaction
  const handleReaction = async (messageId: Id<"dmMessages">, emoji: string) => {
    try {
      await addReactionMutation({ messageId, emoji: emoji as any });
      setShowReactionPicker(null);
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to add reaction");
    }
  };

  // Handle remove reaction
  const handleRemoveReaction = async (messageId: Id<"dmMessages">) => {
    try {
      await removeReactionMutation({ messageId });
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to remove reaction");
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
        <p>You need to be signed in to access your inbox.</p>
      </div>
    );
  }

  return (
    <>
      <DialogComponents />
      <div
        className="container mx-auto "
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <div className="flex gap-6 h-[calc(100vh-12rem)]">
          {/* Conversations List */}
          <div
            className={`${
              selectedConversationId ? "hidden lg:flex" : "flex"
            } w-full lg:w-80 flex-shrink-0 bg-card rounded-lg border border-border flex-col overflow-hidden`}
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex-shrink-0 bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-foreground" />
                  <h1 className="text-lg font-semibold text-foreground">
                    Chats
                  </h1>
                </div>
                {conversations && conversations.length > 0 && (
                  <button
                    onClick={handleClearInbox}
                    disabled={isClearingInbox}
                    className="text-xs text-red-600 hover:text-red-800 transition-colors font-medium"
                  >
                    {isClearingInbox ? "Clearing..." : "Clear All"}
                  </button>
                )}
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-white">
              {!conversations || conversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-border" />
                  <p className="font-medium">No conversations yet</p>
                  <p className="text-sm mt-2">
                    Start a conversation by visiting a user's profile
                  </p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation._id}
                    onClick={() =>
                      router.push(`/inbox?conversation=${conversation._id}`)
                    }
                    className={`w-full p-3 border-b border-border hover:bg-muted text-left transition-colors ${
                      selectedConversationId === conversation._id
                        ? "bg-muted"
                        : "bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {conversation.otherUser.username ? (
                            <a
                              href={`/${conversation.otherUser.username}`}
                              className="font-semibold text-foreground text-sm truncate hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {conversation.otherUser.name}
                            </a>
                          ) : (
                            <p className="font-semibold text-foreground text-sm truncate">
                              {conversation.otherUser.name}
                            </p>
                          )}
                          {!conversation.otherUser.inboxEnabled && (
                            <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                              Disabled
                            </span>
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <p className="text-xs text-muted-foreground truncate">
                            {conversation.lastMessage.content}
                          </p>
                        )}
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="flex-shrink-0">
                          <div className="bg-foreground text-primary-foreground text-xs font-medium rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                            {conversation.unreadCount}
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div
            className={`${
              selectedConversationId ? "flex" : "hidden lg:flex"
            } flex-1 flex-col overflow-hidden bg-card rounded-lg border border-border`}
          >
            {!selectedConversationId ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-border" />
                  <p className="font-medium">
                    Select a conversation to view messages
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0 bg-card">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => router.push("/inbox")}
                      className="lg:hidden p-2 hover:bg-muted rounded-md transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    {selectedConversation?.otherUser.username ? (
                      <a
                        href={`/${selectedConversation.otherUser.username}`}
                        className="hover:opacity-80 transition-opacity"
                      >
                        <p className="font-semibold text-foreground">
                          {selectedConversation.otherUser.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{selectedConversation.otherUser.username}
                        </p>
                      </a>
                    ) : (
                      <div>
                        <p className="font-semibold text-foreground">
                          {selectedConversation?.otherUser.name}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBlockUser}
                      disabled={isBlocking}
                      className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
                      title={isUserBlockedQuery ? "Unblock user" : "Block user"}
                    >
                      <Ban className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleReportUser}
                      disabled={isReporting}
                      className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
                      title="Report user"
                    >
                      <Flag className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleDeleteConversation}
                      disabled={isDeleting}
                      className="p-2 hover:bg-muted rounded-md transition-colors text-red-600"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-background">
                  {messages && messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <p className="font-medium">
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  ) : (
                    messages?.map((message) => {
                      const isOwnMessage =
                        currentUser && message.senderId === currentUser._id;
                      return (
                        <div
                          key={message._id}
                          className={`flex flex-col ${
                            isOwnMessage ? "items-end" : "items-start"
                          }`}
                          onMouseEnter={() => setHoveredMessage(message._id)}
                          onMouseLeave={() => {
                            setHoveredMessage(null);
                            if (showReactionPicker !== message._id) {
                              setShowReactionPicker(null);
                            }
                          }}
                        >
                          <div className="relative max-w-[70%]">
                            <div
                              className={`rounded-lg p-3 ${
                                isOwnMessage
                                  ? "bg-foreground text-primary-foreground"
                                  : "bg-muted text-foreground"
                              }`}
                            >
                              <p className="text-sm break-words">
                                {parseMessageWithMentions(
                                  message.content,
                                  !!isOwnMessage,
                                )}
                              </p>
                            </div>

                            {/* Reaction button (appears on hover) */}
                            {hoveredMessage === message._id &&
                              showReactionPicker !== message._id && (
                                <button
                                  onClick={() =>
                                    setShowReactionPicker(message._id)
                                  }
                                  className={`absolute -bottom-2 ${
                                    isOwnMessage ? "left-0" : "right-0"
                                  } bg-card border border-border rounded-full p-1 hover:bg-muted transition-colors`}
                                  title="Add reaction"
                                >
                                  <Smile className="w-4 h-4 text-muted-foreground" />
                                </button>
                              )}

                            {/* Reaction picker */}
                            {showReactionPicker === message._id && (
                              <div
                                className={`absolute top-full mt-2 ${
                                  isOwnMessage ? "right-0" : "left-0"
                                } bg-card border border-border rounded-lg p-2 flex gap-1 z-10`}
                                onMouseLeave={() => setShowReactionPicker(null)}
                              >
                                {REACTION_EMOJIS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() =>
                                      handleReaction(message._id, emoji)
                                    }
                                    className="text-2xl hover:scale-125 transition-transform p-1"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Display reactions */}
                            {message.reactions.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {message.reactions.map((reaction) => {
                                  const isUserReaction = reaction.users.some(
                                    (u) => u.userId === currentUser?._id,
                                  );
                                  return (
                                    <button
                                      key={reaction.emoji}
                                      onClick={() => {
                                        if (isUserReaction) {
                                          handleRemoveReaction(message._id);
                                        }
                                      }}
                                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                                        isUserReaction
                                          ? "bg-foreground text-primary-foreground border-2 border-foreground"
                                          : "bg-muted text-foreground border border-border"
                                      } hover:scale-105 transition-transform`}
                                      title={reaction.users
                                        .map((u) => u.name)
                                        .join(", ")}
                                    >
                                      <span>{reaction.emoji}</span>
                                      <span className="text-xs">
                                        {reaction.count}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <p className="text-xs text-gray-500 mt-1 px-1">
                            {new Date(message._creationTime).toLocaleString(
                              [],
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                {selectedConversation?.otherUser.inboxEnabled === false ? (
                  <div className="p-4 border-t border-border bg-muted flex-shrink-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Inbox className="w-5 h-5" />
                      <p>
                        This user has disabled their inbox and cannot receive
                        messages.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSendMessage}
                    className="p-4 border-t border-border flex-shrink-0 bg-card"
                  >
                    <div className="flex gap-2">
                      <textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message... (Shift+Enter to send)"
                        className="flex-1 px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm resize-none"
                        maxLength={2000}
                        disabled={isSending}
                        rows={3}
                        data-gramm="false"
                        data-gramm_editor="false"
                        data-enable-grammarly="false"
                      />
                      <button
                        type="submit"
                        disabled={isSending || !messageInput.trim()}
                        className="px-5 py-2.5 bg-foreground text-primary-foreground rounded-lg hover:opacity-90 transition-colors disabled:bg-muted-foreground disabled:cursor-not-allowed flex items-center gap-2 font-medium text-sm self-end"
                      >
                        {isSending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Send
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {messageInput.length}/2000 characters
                    </p>
                  </form>
                )}
              </>
            )}
          </div>

          {/* Right Sidebar - Community Section */}
        </div>

        {/* Error Message Banner */}
        {errorMessage && (
          <div className="fixed bottom-4 right-4 max-w-md bg-card border-2 border-red-600 rounded-lg p-4 z-50">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-foreground">{errorMessage}</p>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-muted-foreground hover:text-foreground text-lg font-bold"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Block Confirmation Modal */}
        {showBlockModal && selectedConversation && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                {isUserBlockedQuery ? "Unblock User" : "Block User"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {isUserBlockedQuery
                  ? `Unblock ${selectedConversation.otherUser.name}? They will be able to send you messages again.`
                  : `Block ${selectedConversation.otherUser.name}? They will no longer be able to send you messages.`}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowBlockModal(false)}
                  disabled={isBlocking}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBlockAction}
                  disabled={isBlocking}
                  className="px-4 py-2 text-sm font-medium bg-foreground text-primary-foreground rounded-md hover:opacity-90 transition-colors disabled:bg-muted-foreground disabled:cursor-not-allowed"
                >
                  {isBlocking
                    ? "Processing..."
                    : isUserBlockedQuery
                      ? "Unblock"
                      : "Block"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report User Modal */}
        {showReportModal && selectedConversation && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Report User
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Why are you reporting {selectedConversation.otherUser.name}?
              </p>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Please provide a detailed reason..."
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm resize-none"
                rows={4}
                maxLength={500}
                disabled={isReporting}
              />
              <p className="text-xs text-muted-foreground mt-2 mb-4">
                {reportReason.length}/500 characters
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportReason("");
                  }}
                  disabled={isReporting}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReport}
                  disabled={isReporting || !reportReason.trim()}
                  className="px-4 py-2 text-sm font-medium bg-foreground text-primary-foreground rounded-md hover:opacity-90 transition-colors disabled:bg-muted-foreground disabled:cursor-not-allowed"
                >
                  {isReporting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

