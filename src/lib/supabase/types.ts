// Hand-rolled types matching supabase/migrations/0001_init.sql.
// Replace with `supabase gen types typescript` once the CLI is set up.

export type ReactionType =
  | "funny"
  | "insane"
  | "sad"
  | "cringe"
  | "mindblown"
  | "viral";

export type StoryStatus = "published" | "flagged" | "removed" | "draft";

export type AIScore = {
  emotion_score?: number;
  drama_level?: number;
  believability?: "low" | "medium" | "high";
  summary?: string;
  viral_potential?: number;
};

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  reputation: number;
  is_admin: boolean;
  rules_accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

type CategoryRow = {
  slug: string;
  name_en: string;
  name_ru: string;
  emoji: string | null;
  display_order: number;
};

type StoryRow = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  category_slug: string;
  tags: string[];
  is_anonymous: boolean;
  status: StoryStatus;
  media_urls: string[];
  ai_score: AIScore | null;
  view_count: number;
  is_featured: boolean;
  language: "en" | "ru";
  created_at: string;
  updated_at: string;
};

type ReactionRow = {
  id: string;
  story_id: string;
  user_id: string;
  type: ReactionType;
  created_at: string;
};

type CommentRow = {
  id: string;
  story_id: string;
  parent_id: string | null;
  author_id: string;
  body: string;
  is_anonymous: boolean;
  is_pinned: boolean;
  upvote_count: number;
  created_at: string;
};

type CommentVoteRow = {
  comment_id: string;
  user_id: string;
  vote: -1 | 1;
  created_at: string;
};

type ReportRow = {
  id: string;
  reporter_id: string;
  story_id: string | null;
  comment_id: string | null;
  reason: string;
  status: "open" | "reviewed" | "dismissed";
  created_at: string;
};

type StoryFeedView = {
  id: string;
  title: string;
  body: string;
  category_slug: string;
  category_name_en: string;
  category_name_ru: string;
  category_emoji: string | null;
  tags: string[];
  is_anonymous: boolean;
  status: StoryStatus;
  media_urls: string[];
  ai_score: AIScore | null;
  view_count: number;
  is_featured: boolean;
  language: "en" | "ru";
  created_at: string;
  author_id: string | null;
  author_username: string;
  author_avatar: string | null;
  reaction_total: number;
  comment_count: number;
  reaction_breakdown: Partial<Record<ReactionType, number>>;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: { id: string; username: string } & Partial<ProfileRow>;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      categories: {
        Row: CategoryRow;
        Insert: CategoryRow;
        Update: Partial<CategoryRow>;
        Relationships: [];
      };
      stories: {
        Row: StoryRow;
        Insert: {
          author_id: string;
          title: string;
          body: string;
          category_slug: string;
          is_anonymous?: boolean;
          tags?: string[];
          media_urls?: string[];
          status?: StoryStatus;
          ai_score?: AIScore | null;
          language?: "en" | "ru";
          is_featured?: boolean;
        };
        Update: Partial<StoryRow>;
        Relationships: [];
      };
      reactions: {
        Row: ReactionRow;
        Insert: { story_id: string; user_id: string; type: ReactionType };
        Update: Partial<ReactionRow>;
        Relationships: [];
      };
      comments: {
        Row: CommentRow;
        Insert: {
          story_id: string;
          author_id: string;
          body: string;
          parent_id?: string | null;
          is_anonymous?: boolean;
        };
        Update: Partial<CommentRow>;
        Relationships: [];
      };
      comment_votes: {
        Row: CommentVoteRow;
        Insert: { comment_id: string; user_id: string; vote: -1 | 1 };
        Update: { vote: -1 | 1 };
        Relationships: [];
      };
      reports: {
        Row: ReportRow;
        Insert: {
          reporter_id: string;
          reason: string;
          story_id?: string | null;
          comment_id?: string | null;
        };
        Update: { status: "open" | "reviewed" | "dismissed" };
        Relationships: [];
      };
    };
    Views: {
      story_feed: {
        Row: StoryFeedView;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      reaction_type: ReactionType;
      story_status: StoryStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type StoryFeedRow = StoryFeedView;
export type Profile = ProfileRow;
export type Category = CategoryRow;
export type Comment = CommentRow;
