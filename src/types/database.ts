export type Difficulty = "easy" | "medium" | "hard";
export type PromptStatus = "draft" | "published";
export type EventType = "view" | "copy" | "favorite";
export type InputType = "text" | "number" | "select" | "textarea";

export interface Category {
  id: string;
  slug: string;
  name_zh: string;
  name_en: string;
  icon: string;
  sort_order: number;
  created_at: string;
}

export interface Prompt {
  id: string;
  slug: string;
  title_zh: string;
  title_en: string;
  subtitle: string;
  category_id: string;
  difficulty: Difficulty;
  estimated_minutes: number;
  version: string;
  prompt_body: string;
  prompt_body_en: string | null;
  preview_image_url: string | null;
  boss_tip: string | null;
  example_output: string | null;
  preview_prompt: string | null;
  status: PromptStatus;
  times_copied: number;
  times_viewed: number;
  rating: number;
  ratings_count: number;
  created_at: string;
  updated_at: string;
}

export interface PromptWithCategory extends Prompt {
  category: Category;
}

export interface PromptVariable {
  id: string;
  prompt_id: string;
  key: string;
  label_zh: string;
  label_en: string;
  default_value: string;
  default_value_en: string | null;
  input_type: InputType;
  options: Record<string, string>[] | null;
  sort_order: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface PromptTag {
  prompt_id: string;
  tag_id: string;
}

export interface RelatedPrompt {
  prompt_id: string;
  related_id: string;
  sort_order: number;
}

export interface Industry {
  id: string;
  slug: string;
  name_zh: string;
  name_en: string;
  sort_order: number;
  created_at: string;
}

export interface PromptEvent {
  id: number;
  prompt_id: string;
  event_type: EventType;
  anon_id: string;
  created_at: string;
}

export interface PromptDetail extends PromptWithCategory {
  variables: PromptVariable[];
  tags: Tag[];
  related_prompts: (Prompt & { category: Category })[];
}
