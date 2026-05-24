// components/Comments.jsx
import { useEffect, useState } from 'react';
import { useCommentStore } from '../store/useCommentStore';
import { useAuthStore } from '../store/authStore';
import { formatDistanceToNow } from 'date-fns';

export default function Comments({ recipeId }) {
  const { comments, loading, fetchComments, addComment, deleteComment } = useCommentStore();
  const { user } = useAuthStore();
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null); // { id, username }
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchComments(recipeId); }, [recipeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    await addComment(recipeId, text.trim(), replyTo?.id || null);
    setText('');
    setReplyTo(null);
    setSubmitting(false);
  };

  // Nest replies under parents
  const topLevel = comments.filter((c) => !c.parentComment);
  const getReplies = (parentId) => comments.filter((c) => c.parentComment === parentId);

  return (
    <div className="comments-section">
      <h3>{comments.length} Comments</h3>

      {user && (
        <form onSubmit={handleSubmit} className="comment-form">
          {replyTo && (
            <div className="reply-indicator">
              Replying to @{replyTo.username}
              <button type="button" onClick={() => setReplyTo(null)}>✕</button>
            </div>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={replyTo ? `Reply to @${replyTo.username}...` : 'Add a comment...'}
            rows={3}
            maxLength={1000}
          />
          <button type="submit" disabled={submitting || !text.trim()}>
            {submitting ? 'Posting...' : replyTo ? 'Reply' : 'Comment'}
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading comments...</p>
      ) : (
        <ul className="comment-list">
          {topLevel.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              replies={getReplies(comment._id)}
              currentUser={user}
              recipeId={recipeId}
              onReply={(id, username) => setReplyTo({ id, username })}
              onDelete={deleteComment}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CommentItem({ comment, replies, currentUser, recipeId, onReply, onDelete }) {
  const isOwner = currentUser?._id === comment.author._id;

  return (
    <li className="comment-item">
      <img src={comment.author.avatar} alt={comment.author.username} className="comment-avatar" />
      <div className="comment-body">
        <div className="comment-meta">
          <span className="comment-username">@{comment.author.username}</span>
          <span className="comment-time">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="comment-text">{comment.text}</p>
        <div className="comment-actions">
          {currentUser && (
            <button onClick={() => onReply(comment._id, comment.author.username)}>Reply</button>
          )}
          {isOwner && (
            <button onClick={() => onDelete(recipeId, comment._id)} className="delete-btn">Delete</button>
          )}
        </div>

        {replies.length > 0 && (
          <ul className="replies-list">
            {replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                replies={[]}
                currentUser={currentUser}
                recipeId={recipeId}
                onReply={onReply}
                onDelete={onDelete}
              />
            ))}
          </ul>
        )}</div>
    </li>
  );
}