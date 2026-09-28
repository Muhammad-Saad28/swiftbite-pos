export type Database = {
  public: {
    tables: {
      users: {
        Row: {
          id: string;
          name: string | null;
          email: string;
          role: "admin" | "waiter" | "kitchen";
          active: boolean;
          status: "pending" | "approved" | "rejected";
          last_sign_in_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          email: string;
          role: "admin" | "waiter" | "kitchen";
          active?: boolean;
          status?: "pending" | "approved" | "rejected";
        };
        Update: {
          name?: string | null;
          email?: string;
          role?: "admin" | "waiter" | "kitchen";
          active?: boolean;
          status?: "pending" | "approved" | "rejected";
        };
      };
      tables: {
        Row: {
          id: string;
          table_number: number;
          capacity: number;
          status: "available" | "occupied" | "reserved";
          reserved_by: string | null;
          reserved_phone: string | null;
          reserved_time: string | null;
        };
        Insert: {
          id?: string;
          table_number: number;
          capacity: number;
          status?: "available" | "occupied" | "reserved";
          reserved_by?: string | null;
          reserved_phone?: string | null;
          reserved_time?: string | null;
        };
        Update: {
          status?: "available" | "occupied" | "reserved";
          reserved_by?: string | null;
          reserved_phone?: string | null;
          reserved_time?: string | null;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          active?: boolean;
        };
        Update: {
          name?: string;
          active?: boolean;
        };
      };
      menu_items: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          price: number;
          image: string | null;
          available: boolean;
          featured: boolean;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          description?: string | null;
          price: number;
          image?: string | null;
          available?: boolean;
          featured?: boolean;
        };
        Update: {
          category_id?: string | null;
          name?: string;
          description?: string | null;
          price?: number;
          image?: string | null;
          available?: boolean;
          featured?: boolean;
        };
      };
      orders: {
        Row: {
          id: string;
          table_id: string | null;
          waiter_id: string | null;
          status: "draft" | "pending" | "accepted" | "preparing" | "ready" | "served" | "completed" | "rejected" | "cancelled";
          order_type: "dine_in" | "takeaway" | "delivery";
          payment_method: "cash" | "card" | "qr_online" | "split" | null;
          subtotal: number;
          tax: number;
          discount_amount: number;
          discount_type: "percentage" | "flat" | "none";
          total: number;
          customer_name: string | null;
          customer_phone: string | null;
          delivery_address: string | null;
          notes: string | null;
          rejection_reason: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          table_id?: string | null;
          waiter_id?: string | null;
          status?: "draft" | "pending" | "accepted" | "preparing" | "ready" | "served" | "completed" | "rejected" | "cancelled";
          order_type?: "dine_in" | "takeaway" | "delivery";
          payment_method?: "cash" | "card" | "qr_online" | "split" | null;
          subtotal?: number;
          tax?: number;
          discount_amount?: number;
          discount_type?: "percentage" | "flat" | "none";
          total?: number;
          customer_name?: string | null;
          customer_phone?: string | null;
          delivery_address?: string | null;
          notes?: string | null;
          rejection_reason?: string | null;
        };
        Update: {
          status?: "draft" | "pending" | "accepted" | "preparing" | "ready" | "served" | "completed" | "rejected" | "cancelled";
          order_type?: "dine_in" | "takeaway" | "delivery";
          payment_method?: "cash" | "card" | "qr_online" | "split" | null;
          subtotal?: number;
          tax?: number;
          discount_amount?: number;
          discount_type?: "percentage" | "flat" | "none";
          total?: number;
          customer_name?: string | null;
          customer_phone?: string | null;
          delivery_address?: string | null;
          notes?: string | null;
          rejection_reason?: string | null;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string;
          quantity: number;
          price: number;
          notes: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id: string;
          quantity: number;
          price: number;
          notes?: string | null;
        };
        Update: {
          quantity?: number;
          price?: number;
          notes?: string | null;
        };
      };
      inventory: {
        Row: {
          id: string;
          name: string;
          unit: string;
          quantity: number;
          minimum_quantity: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          unit: string;
          quantity: number;
          minimum_quantity: number;
        };
        Update: {
          quantity?: number;
          minimum_quantity?: number;
        };
      };
      inventory_transactions: {
        Row: {
          id: string;
          inventory_id: string;
          type: "add" | "remove" | "adjust";
          quantity: number;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          inventory_id: string;
          type: "add" | "remove" | "adjust";
          quantity: number;
          reason?: string | null;
        };
        Update: {
          quantity?: number;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "new_order" | "order_ready" | "order_rejected" | "low_stock" | "info";
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "new_order" | "order_ready" | "order_rejected" | "low_stock" | "info";
          message: string;
          read?: boolean;
        };
        Update: {
          read?: boolean;
        };
      };
    };
    views: {};
    functions: {};
    stored_procedures: {};
  };
};