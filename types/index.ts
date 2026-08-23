// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole   = 'admin' | 'student'
export type UserStatus = 'pending' | 'approved' | 'banned' | 'rejected'
export type Stream     = 'JEE' | 'NEET'
export type Subject    = 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology'
export type NoteType   = 'pdf' | 'image'

// ─── Database Tables ──────────────────────────────────────────────────────────

export interface Profile {
  id:               string
  email:            string
  username:         string
  full_name:        string
  avatar_url:       string | null
  stream:           Stream
  role:             UserRole
  status:           UserStatus
  bio:              string | null
  created_at:       string
  updated_at:       string
}

export interface Channel {
  id:               string
  name:             string
  description:      string | null
  category:         string
  is_announcement:  boolean
  created_at:       string
}

export interface Message {
  id:               string
  channel_id:       string
  sender_id:        string
  content:          string
  image_url:        string | null
  reply_to_id:      string | null
  is_deleted:       boolean
  created_at:       string
  updated_at:       string
  // joins
  sender?:          Profile
  reply_to?:        Message | null
  reactions?:       MessageReaction[]
}

export interface MessageReaction {
  id:               string
  message_id:       string
  user_id:          string
  emoji:            string
  created_at:       string
  // joins
  user?:            Profile
}

export interface PinnedMessage {
  id:               string
  channel_id:       string
  message_id:       string
  pinned_by:        string
  created_at:       string
  message?:         Message
}

export interface DMConversation {
  id:               string
  created_at:       string
  participants?:    Profile[]
  last_message?:    DirectMessage | null
}

export interface DirectMessage {
  id:               string
  conversation_id:  string
  sender_id:        string
  content:          string
  image_url:        string | null
  is_deleted:       boolean
  created_at:       string
  sender?:          Profile
}

export interface Test {
  id:               string
  title:            string
  description:      string | null
  subject:          Subject
  stream:           Stream
  chapter:          string
  duration_minutes: number
  total_marks:      number
  is_published:     boolean
  created_by:       string
  created_at:       string
  updated_at:       string
  question_count?:  number
}

export interface Question {
  id:               string
  test_id:          string
  question_text:    string
  option_a:         string
  option_b:         string
  option_c:         string
  option_d:         string
  correct_option:   'A' | 'B' | 'C' | 'D'
  marks:            number
  explanation:      string | null
  order_index:      number
}

export interface TestAttempt {
  id:               string
  test_id:          string
  user_id:          string
  score:            number
  total_marks:      number
  accuracy:         number
  time_taken:       number // seconds
  completed_at:     string
  created_at:       string
  test?:            Test
  answers?:         AttemptAnswer[]
}

export interface AttemptAnswer {
  id:               string
  attempt_id:       string
  question_id:      string
  selected_option:  'A' | 'B' | 'C' | 'D' | null
  is_correct:       boolean
  question?:        Question
}

export interface Note {
  id:               string
  title:            string
  description:      string | null
  subject:          Subject
  file_url:         string
  file_type:        NoteType
  file_size:        number
  uploaded_by:      string
  download_count:   number
  created_at:       string
  uploader?:        Profile
}

export interface Notification {
  id:               string
  user_id:          string
  title:            string
  message:          string
  type:             'announcement' | 'test' | 'admin' | 'general'
  is_read:          boolean
  link:             string | null
  created_at:       string
}

// ─── UI / State types ─────────────────────────────────────────────────────────

export interface TypingUser {
  user_id:   string
  username:  string
  timestamp: number
}

export interface LeaderboardEntry {
  rank:           number
  user_id:        string
  username:       string
  full_name:      string
  avatar_url:     string | null
  stream:         Stream
  total_score:    number
  avg_accuracy:   number
  attempts_count: number
}

export interface TestResult {
  attempt:      TestAttempt
  test:         Test
  answers:      AttemptAnswer[]
  questions:    Question[]
  correct:      number
  incorrect:    number
  skipped:      number
}

export interface SubjectStats {
  subject:        Subject
  attempts:       number
  avg_score:      number
  avg_accuracy:   number
  best_score:     number
}

// ─── Memory Wall ──────────────────────────────────────────────────────────────

export interface Memory {
  id:           string
  photo_url:    string
  caption:      string | null
  uploaded_by:  string
  taken_at:     string | null
  created_at:   string
  // joins
  uploader?:    Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'>
  reactions?:   MemoryReaction[]
  tags?:        MemoryTag[]
}

export interface MemoryReaction {
  memory_id:  string
  user_id:    string
  emoji:      string
  user?:      Pick<Profile, 'id' | 'username'>
}

export interface MemoryTag {
  memory_id:  string
  user_id:    string
  user?:      Pick<Profile, 'id' | 'username' | 'avatar_url'>
}

// ─── Social Feed ──────────────────────────────────────────────────────────────

export type FeedAuthor = Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url' | 'stream' | 'role'>

export interface Post {
  id:          string
  author_id:   string
  content:     string
  image_url:   string | null
  mood:        string | null
  is_deleted:  boolean
  created_at:  string
  updated_at:  string
  // joins
  author?:     FeedAuthor
  likes?:      PostLike[]
  comments?:   PostComment[]
}

export interface PostLike {
  post_id:     string
  user_id:     string
  created_at?: string
}

export interface PostComment {
  id:          string
  post_id:     string
  author_id:   string
  content:     string
  created_at:  string
  // joins
  author?:     FeedAuthor
}
