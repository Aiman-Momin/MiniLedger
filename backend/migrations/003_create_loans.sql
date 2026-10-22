CREATE TABLE loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  friend_name text NOT NULL,
  amount_paise bigint NOT NULL CHECK (amount_paise > 0),
  due_date date NOT NULL,
  repaid_at timestamptz,
  receipt_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX loans_user_id_created_at_idx ON loans (user_id, created_at DESC);
