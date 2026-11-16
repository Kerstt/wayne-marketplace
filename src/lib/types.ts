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
  status: "active" | "sold";
  sold_at: string | null;
};

export type Seller = {
  user_id: string;
  email: string;
  stripe_account_id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  listing_id: string | null;
  listing_title: string;
  seller_user_id: string | null;
  stripe_account_id: string;
  checkout_session_id: string;
  payment_intent_id: string | null;
  amount_total: number;
  application_fee_amount: number;
  currency: string;
  buyer_email: string | null;
  status: "pending" | "paid" | "refunded";
  confirmed_via: "webhook" | "success_page" | null;
  created_at: string;
  paid_at: string | null;
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
