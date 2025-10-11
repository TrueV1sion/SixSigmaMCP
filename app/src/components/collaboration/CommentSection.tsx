import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { MessageCircle, Send, Reply, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  project_id: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  user: {
    full_name: string;
    email: string;
  };
  replies?: Comment[];
}

interface CommentSectionProps {
  projectId: string;
  entityType?: string;
  entityId?: string;
}

export default function CommentSection({ projectId, entityType = 'general', entityId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComments();

    const subscription = supabase
      .channel(`comments-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `project_id=eq.${projectId}`,
      }, () => {
        loadComments();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [projectId, entityType, entityId]);

  const loadComments = async () => {
    let query = supabase
      .from('comments')
      .select(`
        *,
        user:profiles(full_name, email)
      `)
      .eq('project_id', projectId)
      .eq('entity_type', entityType)
      .order('created_at', { ascending: false });

    if (entityId) {
      query = query.eq('entity_id', entityId);
    } else {
      query = query.is('entity_id', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading comments:', error);
      return;
    }

    const threaded = buildCommentTree(data || []);
    setComments(threaded);
  };

  const buildCommentTree = (flatComments: any[]): Comment[] => {
    const map = new Map<string, Comment>();
    const roots: Comment[] = [];

    flatComments.forEach(comment => {
      map.set(comment.id, { ...comment, replies: [] });
    });

    flatComments.forEach(comment => {
      const node = map.get(comment.id)!;
      if (comment.parent_id) {
        const parent = map.get(comment.parent_id);
        if (parent) {
          parent.replies!.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setLoading(true);

    const { error } = await supabase.from('comments').insert({
      project_id: projectId,
      entity_type: entityType,
      entity_id: entityId || null,
      user_id: user.id,
      content: newComment.trim(),
      parent_id: parentId || null,
    });

    if (error) {
      console.error('Error creating comment:', error);
    } else {
      setNewComment('');
      setReplyTo(null);
      await loadComments();
    }

    setLoading(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
    } else {
      await loadComments();
    }
  };

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => (
    <div className={`${depth > 0 ? 'ml-8 mt-3 border-l-2 border-slate-200 pl-4' : 'mb-4'}`}>
      <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {comment.user.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="text-sm font-medium text-slate-900">
                {comment.user.full_name || comment.user.email}
              </div>
              <div className="text-xs text-slate-500">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReplyTo(comment.id)}
              className="text-slate-400 hover:text-blue-600 transition-colors p-1"
              title="Reply"
            >
              <Reply size={16} />
            </button>
            {comment.user_id === user?.id && (
              <button
                onClick={() => handleDelete(comment.id)}
                className="text-slate-400 hover:text-red-600 transition-colors p-1"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
        <p className="text-slate-700 text-sm whitespace-pre-wrap">{comment.content}</p>

        {replyTo === comment.id && (
          <form onSubmit={(e) => handleSubmit(e, comment.id)} className="mt-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a reply..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
              rows={2}
            />
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                disabled={loading || !newComment.trim()}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm flex items-center gap-1"
              >
                <Send size={14} />
                Reply
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplyTo(null);
                  setNewComment('');
                }}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle size={20} className="text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-900">
          Comments ({comments.length})
        </h3>
      </div>

      <form onSubmit={(e) => handleSubmit(e)} className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Send size={16} />
            Comment
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
}
