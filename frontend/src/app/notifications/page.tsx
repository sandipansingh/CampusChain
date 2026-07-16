"use client";

import React, { useState } from "react";
import {
  Bell,
  ArrowRightLeft,
  Lock,
  Ticket,
  ShieldAlert,
  Clock,
  CheckCheck,
  X
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: "TRANSFER" | "ESCROW" | "TICKET" | "SYSTEM";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  status: "success" | "warning" | "info";
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "n1",
      type: "TRANSFER",
      title: "Incoming Transfer",
      description: "Received 50.00 CAMP reward tokens from University Merit Faucet.",
      timestamp: "5 mins ago",
      read: false,
      status: "success",
    },
    {
      id: "n2",
      type: "SYSTEM",
      title: "Wallet Role Confirmed",
      description: "Your Stellar keypair has been verified and registered on-chain.",
      timestamp: "10 mins ago",
      read: false,
      status: "success",
    },
    {
      id: "n3",
      type: "ESCROW",
      title: "Escrow Agreement Created",
      description: "Escrow #244 created successfully with Seller GCM5...7AFN for 120.00 CAMP.",
      timestamp: "1 hour ago",
      read: true,
      status: "info",
    },
    {
      id: "n4",
      type: "TICKET",
      title: "Event Pass Acquired",
      description: "Ticket pass #88 purchased for 'Summer Accreditation Festival'. Verified on-chain.",
      timestamp: "2 hours ago",
      read: true,
      status: "success",
    },
  ]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcon = (type: string) => {
    if (type === "TRANSFER") return <ArrowRightLeft className="w-4 h-4" />;
    if (type === "ESCROW") return <Lock className="w-4 h-4" />;
    if (type === "TICKET") return <Ticket className="w-4 h-4" />;
    return <ShieldAlert className="w-4 h-4" />;
  };

  const getStyle = (status: string, read: boolean) => {
    if (!read) {
      if (status === "success") return "bg-emerald-50 text-emerald-600 border-emerald-100";
      if (status === "warning") return "bg-amber-50 text-amber-600 border-amber-100";
      return "bg-blue-50 text-blue-600 border-blue-100";
    }
    return "bg-slate-50 text-slate-400 border-slate-200";
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
            Notifications
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Stay updated with secure smart contract updates, incoming transfers, and door validation confirmations.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="h-11 px-4 bg-white border border-border text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-800 flex items-center gap-2 active:scale-95 transition-all shadow-sm"
          >
            <CheckCheck className="w-4 h-4 text-accent" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-border rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Inbox ({notifications.length})
          </span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold bg-accent text-white px-2.5 py-0.5 rounded-full shadow-sm">
              {unreadCount} Unread
            </span>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-3">
            <Bell className="w-8 h-8 text-slate-300 animate-bounce" />
            <span className="font-bold text-slate-400 text-xs uppercase tracking-widest">
              Your inbox is empty
            </span>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`py-5 first:pt-0 last:pb-0 flex items-start justify-between gap-4 group transition-colors ${
                  !item.read ? "bg-white" : "opacity-75"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Status Indicator Icon */}
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${getStyle(item.status, item.read)}`}>
                    {getIcon(item.type)}
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-extrabold uppercase ${!item.read ? "text-slate-900" : "text-slate-500"}`}>
                        {item.title}
                      </span>
                      {!item.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mt-2 uppercase">
                      <Clock className="w-3 h-3" />
                      <span>{item.timestamp}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deleteNotification(item.id)}
                  className="w-7 h-7 rounded bg-slate-50 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-slate-400 active:scale-95 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
