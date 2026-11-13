export type Listing = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  email: string;
  category: string;
  location: string;
  image_url: string | null;
  image_path: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  listing_id: string;
  seller_id: string;
  sender_id: string;
  sender_name: string;
  sender_email: string;
  body: string;
  created_at: string;
  listings?: Pick<Listing, "id" | "title" | "image_url" | "price"> | null;
};
