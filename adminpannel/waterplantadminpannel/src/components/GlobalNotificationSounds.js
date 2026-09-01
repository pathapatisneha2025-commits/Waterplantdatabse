import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

// ============================================================
// API
// ============================================================

const BASE_URL =
  "https://api2.ajpartyhouse.in";

// ============================================================
// STORAGE
// ============================================================

const COUNT_STORAGE_KEY =
  "admin_new_order_count";

const SEEN_ORDERS_STORAGE_KEY =
  "admin_seen_order_ids";

// ============================================================
// GLOBAL ORDER NOTIFICATION
// ============================================================

export default function GlobalOrderNotification() {
  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [newOrderCount, setNewOrderCount] =
    useState(() => {
      try {
        const saved =
          localStorage.getItem(
            COUNT_STORAGE_KEY
          );

        return saved
          ? Number(saved)
          : 0;
      } catch {
        return 0;
      }
    });

  const [showNotification, setShowNotification] =
    useState(false);

  const [notificationMessage, setNotificationMessage] =
    useState("");

  // ==========================================================
  // REFS
  // ==========================================================

  const previousOrderIds =
    useRef([]);

  const firstOrderCheck =
    useRef(true);

  const intervalRef =
    useRef(null);

  const checkingRef =
    useRef(false);

  const audioContextRef =
    useRef(null);

  const mountedRef =
    useRef(true);

  // ==========================================================
  // SAVE COUNT
  // ==========================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        COUNT_STORAGE_KEY,
        String(newOrderCount)
      );
    } catch (error) {
      console.log(
        "Unable to save notification count:",
        error
      );
    }
  }, [newOrderCount]);

  // ==========================================================
  // LOAD PREVIOUSLY SEEN ORDER IDS
  // ==========================================================

  const loadSeenOrderIds = () => {
    try {
      const saved =
        localStorage.getItem(
          SEEN_ORDERS_STORAGE_KEY
        );

      if (!saved) {
        return [];
      }

      const parsed =
        JSON.parse(saved);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch (error) {
      console.log(
        "Error loading seen orders:",
        error
      );

      return [];
    }
  };

  // ==========================================================
  // SAVE SEEN ORDER IDS
  // ==========================================================

  const saveSeenOrderIds = (
    orderIds
  ) => {
    try {
      // Keep only latest 500 IDs
      const limitedIds =
        orderIds.slice(-500);

      localStorage.setItem(
        SEEN_ORDERS_STORAGE_KEY,
        JSON.stringify(limitedIds)
      );
    } catch (error) {
      console.log(
        "Error saving seen orders:",
        error
      );
    }
  };

  // ==========================================================
  // CREATE AUDIO CONTEXT
  //
  // NO MP3
  // ==========================================================

  const getAudioContext = () => {
    try {
      if (
        typeof window ===
        "undefined"
      ) {
        return null;
      }

      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContext) {
        console.log(
          "Web Audio API is not supported."
        );

        return null;
      }

      if (
        !audioContextRef.current
      ) {
        audioContextRef.current =
          new AudioContext();
      }

      return audioContextRef.current;
    } catch (error) {
      console.log(
        "Audio context error:",
        error
      );

      return null;
    }
  };

  // ==========================================================
  // UNLOCK AUDIO
  //
  // Browser requires user interaction before
  // allowing audio in many browsers.
  // ==========================================================

  useEffect(() => {
    const unlockAudio =
      async () => {
        try {
          const audioContext =
            getAudioContext();

          if (!audioContext) {
            return;
          }

          if (
            audioContext.state ===
            "suspended"
          ) {
            await audioContext.resume();
          }
        } catch (error) {
          console.log(
            "Audio unlock error:",
            error
          );
        }
      };

    window.addEventListener(
      "click",
      unlockAudio,
      true
    );

    window.addEventListener(
      "keydown",
      unlockAudio,
      true
    );

    window.addEventListener(
      "touchstart",
      unlockAudio,
      true
    );

    return () => {
      window.removeEventListener(
        "click",
        unlockAudio,
        true
      );

      window.removeEventListener(
        "keydown",
        unlockAudio,
        true
      );

      window.removeEventListener(
        "touchstart",
        unlockAudio,
        true
      );
    };
  }, []);

  // ==========================================================
  // PLAY ORDER SOUND
  //
  // NO MP3
  // Uses Web Audio API oscillator.
  // ==========================================================


const playNotificationSound = async () => {
  try {
    const audioContext = getAudioContext();

    if (!audioContext) {
      return;
    }

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const now = audioContext.currentTime;

    // ====================================================
    // 🔊 BEEP 1 - LOUDER
    // ====================================================

    const oscillator1 =
      audioContext.createOscillator();

    const gain1 =
      audioContext.createGain();

    oscillator1.type = "sine";

    oscillator1.frequency.setValueAtTime(
      880,
      now
    );

    oscillator1.frequency.setValueAtTime(
      1175,
      now + 0.15
    );

    oscillator1.connect(gain1);
    gain1.connect(audioContext.destination);

    gain1.gain.setValueAtTime(
      0.0001,
      now
    );

    // 🔊 Increased volume
    gain1.gain.exponentialRampToValueAtTime(
      0.75,
      now + 0.04
    );

    gain1.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.35
    );

    oscillator1.start(now);

    oscillator1.stop(
      now + 0.38
    );

    // ====================================================
    // 🔊 BEEP 2 - LOUDER
    // ====================================================

    const oscillator2 =
      audioContext.createOscillator();

    const gain2 =
      audioContext.createGain();

    oscillator2.type = "sine";

    oscillator2.frequency.setValueAtTime(
      1175,
      now + 0.20
    );

    oscillator2.frequency.setValueAtTime(
      1480,
      now + 0.35
    );

    oscillator2.connect(gain2);
    gain2.connect(audioContext.destination);

    gain2.gain.setValueAtTime(
      0.0001,
      now + 0.20
    );

    // 🔊 Increased volume
    gain2.gain.exponentialRampToValueAtTime(
      0.70,
      now + 0.24
    );

    gain2.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.65
    );

    oscillator2.start(
      now + 0.20
    );

    oscillator2.stop(
      now + 0.68
    );

  } catch (error) {
    console.log(
      "Notification sound error:",
      error
    );
  }
};


  // ==========================================================
  // REQUEST BROWSER NOTIFICATION
  // ==========================================================

  useEffect(() => {
    const requestPermission =
      async () => {
        try {
          if (
            typeof window ===
            "undefined"
          ) {
            return;
          }

          if (
            !("Notification" in window)
          ) {
            return;
          }

          if (
            Notification.permission ===
            "default"
          ) {
            const permission =
              await Notification.requestPermission();

            console.log(
              "Notification permission:",
              permission
            );
          }
        } catch (error) {
          console.log(
            "Notification permission error:",
            error
          );
        }
      };

    requestPermission();
  }, []);

  // ==========================================================
  // BROWSER NOTIFICATION
  // ==========================================================

  const showBrowserNotification =
    (orders) => {
      try {
        if (
          typeof window ===
          "undefined"
        ) {
          return;
        }

        if (
          !("Notification" in window)
        ) {
          return;
        }

        if (
          Notification.permission !==
          "granted"
        ) {
          return;
        }

        const latestOrder =
          orders[
            orders.length - 1
          ];

        const customerName =
          latestOrder?.full_name ||
          latestOrder?.customer_name ||
          "Customer";

        let title =
          "🛎️ New Order Received";

        let body =
          `New order from ${customerName}`;

        if (
          orders.length > 1
        ) {
          title =
            `🛎️ ${orders.length} New Orders`;

          body =
            `${orders.length} new orders have been placed.`;
        }

        const browserNotification =
          new Notification(
            title,
            {
              body,
              icon: "/favicon.ico",
              tag:
                "new-orders-" +
                Date.now(),
            }
          );

        browserNotification.onclick =
          () => {
            window.focus();

            navigate(
              "/adminorders"
            );

            browserNotification.close();
          };
      } catch (error) {
        console.log(
          "Browser notification error:",
          error
        );
      }
    };

  // ==========================================================
  // CHECK FOR NEW ORDERS
  // ==========================================================

  const checkForNewOrders =
    async () => {
      if (
        checkingRef.current
      ) {
        return;
      }

      checkingRef.current =
        true;

      try {
        const response =
          await fetch(
            `${BASE_URL}/orders/all?t=${Date.now()}`,
            {
              method: "GET",
              cache: "no-store",
              headers: {
                "Cache-Control":
                  "no-cache",
                Pragma:
                  "no-cache",
              },
            }
          );

        if (!response.ok) {
          console.log(
            "Orders API returned:",
            response.status
          );

          return;
        }

        const data =
          await response.json();

        // ====================================================
        // SUPPORT ALL RESPONSE FORMATS
        // ====================================================

        const orders =
          Array.isArray(data)
            ? data
            : Array.isArray(
                data?.data
              )
            ? data.data
            : Array.isArray(
                data?.orders
              )
            ? data.orders
            : [];

        // ====================================================
        // CURRENT IDS
        // ====================================================

        const currentOrderIds =
          orders
            .map(
              (order) =>
                order?.id
            )
            .filter(
              (id) =>
                id !== null &&
                id !== undefined
            );

        // ====================================================
        // FIRST CHECK
        //
        // Do not notify about old orders.
        // ====================================================

        if (
          firstOrderCheck.current
        ) {
          previousOrderIds.current =
            currentOrderIds;

          firstOrderCheck.current =
            false;

          // Save existing orders
          // as seen.

          const savedSeen =
            loadSeenOrderIds();

          const merged =
            Array.from(
              new Set([
                ...savedSeen,
                ...currentOrderIds,
              ])
            );

          saveSeenOrderIds(
            merged
          );

          console.log(
            "Initial orders loaded:",
            currentOrderIds.length
          );

          return;
        }

        // ====================================================
        // FIND NEW ORDERS SINCE LAST POLL
        // ====================================================

        const newOrders =
          orders.filter(
            (order) =>
              !previousOrderIds.current.includes(
                order?.id
              )
          );

        // ====================================================
        // NEW ORDERS FOUND
        // ====================================================

        if (
          newOrders.length > 0
        ) {
          console.log(
            "🛎️ NEW ORDERS:",
            newOrders
          );

          // ==================================================
          // UPDATE COUNT
          // ==================================================

          setNewOrderCount(
            (previous) =>
              previous +
              newOrders.length
          );

          // ==================================================
          // SAVE SEEN IDS
          // ==================================================

          const oldSeen =
            loadSeenOrderIds();

          const allSeen =
            Array.from(
              new Set([
                ...oldSeen,
                ...currentOrderIds,
              ])
            );

          saveSeenOrderIds(
            allSeen
          );

          // ==================================================
          // LATEST ORDER
          // ==================================================

          const latestOrder =
            newOrders[
              newOrders.length - 1
            ];

          const customerName =
            latestOrder?.full_name ||
            latestOrder?.customer_name ||
            "Customer";

          // ==================================================
          // MESSAGE
          // ==================================================

          if (
            newOrders.length ===
            1
          ) {
            setNotificationMessage(
              `New order from ${customerName} — Order #${latestOrder.id}`
            );
          } else {
            setNotificationMessage(
              `${newOrders.length} new orders have been received`
            );
          }

          // ==================================================
          // SHOW POPUP
          // ==================================================

          if (
            mountedRef.current
          ) {
            setShowNotification(
              true
            );
          }

          // ==================================================
          // 🔊 SOUND
          // ==================================================

          await playNotificationSound();

          // ==================================================
          // BROWSER NOTIFICATION
          // ==================================================

          showBrowserNotification(
            newOrders
          );
        }

        // ====================================================
        // SAVE CURRENT IDS
        // ====================================================

        previousOrderIds.current =
          currentOrderIds;
      } catch (error) {
        console.log(
          "Error checking orders:",
          error
        );
      } finally {
        checkingRef.current =
          false;
      }
    };

  // ==========================================================
  // START GLOBAL POLLING
  // ==========================================================

  useEffect(() => {
    mountedRef.current =
      true;

    // First check
    checkForNewOrders();

    // Every 10 seconds
    intervalRef.current =
      setInterval(() => {
        checkForNewOrders();
      }, 10000);

    return () => {
      mountedRef.current =
        false;

      if (
        intervalRef.current
      ) {
        clearInterval(
          intervalRef.current
        );

        intervalRef.current =
          null;
      }

      if (
        audioContextRef.current
      ) {
        try {
          audioContextRef.current.close();
        } catch {}
      }
    };
  }, []);

  // ==========================================================
  // OPEN ORDERS
  // ==========================================================

  const openOrders = () => {
    setNewOrderCount(0);

    setShowNotification(
      false
    );

    try {
      localStorage.setItem(
        COUNT_STORAGE_KEY,
        "0"
      );
    } catch {}

    navigate(
      "/adminorders"
    );
  };

  // ==========================================================
  // CLOSE POPUP
  // ==========================================================

  const closePopup = () => {
    setShowNotification(
      false
    );
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <>
      {/* ====================================================
          GLOBAL NOTIFICATION BELL
      ==================================================== */}

      <button
        type="button"
        onClick={openOrders}
        style={styles.globalBell}
        title="New Orders"
        aria-label="New Orders"
      >
        <span
          style={styles.bellIcon}
        >
          🔔
        </span>

        {newOrderCount > 0 && (
          <span
            style={
              styles.notificationBadge
            }
          >
            {newOrderCount > 99
              ? "99+"
              : newOrderCount}
          </span>
        )}
      </button>

      {/* ====================================================
          POPUP
      ==================================================== */}

      {showNotification && (
        <div
          style={
            styles.notificationPopup
          }
        >
          {/* ICON */}

          <div
            style={
              styles.notificationPopupIcon
            }
          >
            🔔
          </div>

          {/* CONTENT */}

          <div
            style={
              styles.notificationPopupContent
            }
          >
            <div
              style={
                styles.notificationTitle
              }
            >
              New Order Received!
            </div>

            <div
              style={
                styles.notificationMessage
              }
            >
              {
                notificationMessage
              }
            </div>

            <button
              type="button"
              onClick={
                openOrders
              }
              style={
                styles.viewOrderBtn
              }
            >
              View Orders
            </button>
          </div>

          {/* CLOSE */}

          <button
            type="button"
            onClick={
              closePopup
            }
            style={
              styles.notificationClose
            }
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = {
  globalBell: {
    position: "fixed",
    top: "18px",
    right: "20px",

    zIndex: 999998,

    width: "46px",
    height: "46px",

    borderRadius: "12px",

    border:
      "1px solid #e5e7eb",

    background:
      "#ffffff",

    cursor: "pointer",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    boxShadow:
      "0 4px 15px rgba(0,0,0,0.12)",

    padding: 0,

    transition:
      "all 0.2s ease",
  },

  bellIcon: {
    fontSize: "21px",
    lineHeight: 1,
  },

  notificationBadge: {
    position: "absolute",

    top: "-7px",
    right: "-7px",

    minWidth: "22px",
    height: "22px",

    padding: "0 5px",

    borderRadius: "20px",

    background:
      "#dc2626",

    color:
      "#ffffff",

    fontSize: "10px",

    fontWeight: "700",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    border:
      "2px solid #ffffff",

    boxSizing:
      "border-box",
  },

  notificationPopup: {
    position: "fixed",

    top: "75px",
    right: "20px",

    zIndex: 999999,

    width: "360px",
    maxWidth:
      "calc(100vw - 40px)",

    background:
      "#ffffff",

    borderRadius: "14px",

    padding: "15px",

    display: "flex",

    alignItems:
      "flex-start",

    gap: "12px",

    boxShadow:
      "0 10px 35px rgba(0,0,0,0.20)",

    border:
      "1px solid #e5e7eb",

    boxSizing:
      "border-box",
  },

  notificationPopupIcon: {
    width: "44px",
    height: "44px",

    borderRadius: "50%",

    background:
      "#fff7ed",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    fontSize: "23px",

    flexShrink: 0,
  },

  notificationPopupContent: {
    flex: 1,
    minWidth: 0,
  },

  notificationTitle: {
    color:
      "#111827",

    fontSize:
      "14px",

    fontWeight:
      "700",

    marginBottom:
      "4px",
  },

  notificationMessage: {
    color:
      "#6b7280",

    fontSize:
      "12px",

    lineHeight:
      "18px",
  },

  notificationClose: {
    border:
      "none",

    background:
      "transparent",

    fontSize:
      "22px",

    lineHeight:
      "22px",

    color:
      "#6b7280",

    cursor:
      "pointer",

    padding: 0,

    width:
      "24px",

    height:
      "24px",

    flexShrink:
      0,
  },

  viewOrderBtn: {
    marginTop:
      "9px",

    border:
      "none",

    background:
      "linear-gradient(135deg, #ff6600, #e65c00)",

    color:
      "#ffffff",

    padding:
      "8px 14px",

    borderRadius:
      "7px",

    cursor:
      "pointer",

    fontSize:
      "12px",

    fontWeight:
      "600",

    boxShadow:
      "0 3px 8px rgba(255,102,0,0.20)",
  },
};