/**
 * Cloud Functions for Srichakra Academy
 *
 * 1. sendReportEmail — Send assessment report via email
 * 2. createRazorpayOrder — Create a Razorpay order for assessment payment
 * 3. verifyRazorpayPayment — Verify Razorpay payment signature & activate access
 *
 * Required secrets (set via Firebase CLI):
 *   firebase functions:secrets:set GMAIL_EMAIL
 *   firebase functions:secrets:set GMAIL_PASSWORD
 *   firebase functions:secrets:set RAZORPAY_KEY_ID
 *   firebase functions:secrets:set RAZORPAY_KEY_SECRET
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

admin.initializeApp();

// ─── Secrets ───
const gmailEmail = defineSecret("GMAIL_EMAIL");
const gmailPassword = defineSecret("GMAIL_PASSWORD");
const razorpayKeyId = defineSecret("RAZORPAY_KEY_ID");
const razorpayKeySecret = defineSecret("RAZORPAY_KEY_SECRET");
const razorpayWebhookSecret = defineSecret("RAZORPAY_WEBHOOK_SECRET");

// ─── Assessment fee in paise ───
// Original: ₹2,999 = 299900 paise
// 10th Anniversary Offer: ₹1,099 = 109900 paise (valid till 30 Apr 2026)
const ASSESSMENT_FEE_PAISE = 159900;     // ₹1,599 (offer)
const ASSESSMENT_FEE_MRP_PAISE = 299900; // ₹2,999 (MRP, for display only)
const COUNSELLING_FEE_PAISE = 139900;    // ₹1,399 — 1:1 post-assessment
const EBOOK_COUPON_DISCOUNT_PAISE = 50000; // ₹500 OFF (e-book coupons)
const ORIGINAL_FEE_PAISE = 299900;

// ────────────────────────────────────────────────────────
// 1. Send Report Email
// ────────────────────────────────────────────────────────
exports.sendReportEmail = onDocumentCreated(
  {
    document: "emailRequests/{docId}",
    secrets: [gmailEmail, gmailPassword],
    region: "asia-south1",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data();
    const { to, studentName, reportHtml } = data;

    if (!to || !reportHtml) {
      console.error("Missing 'to' or 'reportHtml' in emailRequest:", snap.id);
      await snap.ref.update({ status: "error", error: "Missing email or report content" });
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailEmail.value(),
        pass: gmailPassword.value(),
      },
    });

    // ── Build email: embed report INLINE (no attachment) to avoid spam filters ──
    const mailOptions = {
      from: `"Srichakra Academy" <${gmailEmail.value()}>`,
      to,
      subject: `Career Assessment Report — ${studentName || "Student"}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
          <h2 style="color: #006D77;">Srichakra Academy — Career Assessment Report</h2>
          <p>Dear ${studentName || "Student"},</p>
          <p>Please find your <strong>Career Assessment Report</strong> below.</p>
          <p style="color:#555; font-size:13px;">Tip: Use <strong>Ctrl+P</strong> (or ⌘+P on Mac) → <em>Save as PDF</em> to save a copy.</p>
          <hr style="border:none;border-top:2px solid #006D77;margin:24px 0;" />
          ${reportHtml}
          <hr style="border:none;border-top:2px solid #006D77;margin:24px 0;" />
          <p>Best regards,<br/><strong>Srichakra Academy Team</strong></p>
          <p style="color: #999; font-size: 12px;">This is an automated email. For queries, contact us at srichakra.academypdy@gmail.com</p>
        </div>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${to} for student ${studentName} | messageId: ${info.messageId} | response: ${info.response}`);
      await snap.ref.update({
        status: "sent",
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        messageId: info.messageId || null,
      });
    } catch (err) {
      console.error("Failed to send email:", err);
      await snap.ref.update({ status: "error", error: err.message });
    }
  }
);

// ────────────────────────────────────────────────────────
// Admin emails list
// ────────────────────────────────────────────────────────
const ADMIN_EMAILS = [
  "admin@srichakraacademy.org",
  "eswari.srichakra@gmail.com",
];

// ────────────────────────────────────────────────────────
// 2. Send Password Reset Email (bypasses App Check)
// ────────────────────────────────────────────────────────
exports.sendPasswordReset = onCall(
  { region: "asia-south1", secrets: [gmailEmail, gmailPassword] },
  async (request) => {
    const { email } = request.data;
    if (!email || typeof email !== "string") {
      throw new HttpsError("invalid-argument", "Email is required.");
    }

    try {
      // Verify the user exists
      await admin.auth().getUserByEmail(email);
      // Generate the reset link (Admin SDK bypasses App Check)
      const link = await admin.auth().generatePasswordResetLink(email);

      // Send via nodemailer
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailEmail.value(),
          pass: gmailPassword.value(),
        },
      });

      await transporter.sendMail({
        from: `"Srichakra Academy" <${gmailEmail.value()}>`,
        to: email,
        subject: "Password Reset — Srichakra Academy",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #006D77;">Srichakra Academy — Password Reset</h2>
            <p>You requested a password reset for your account.</p>
            <p>Click the button below to set a new password:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${link}" style="background: #006D77; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
            </p>
            <p style="color: #666; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
            <p style="color: #999; font-size: 12px;">— Srichakra Academy Team</p>
          </div>
        `,
      });

      console.log(`Password reset email sent to ${email}`);
      return { success: true, message: "Password reset email sent. Check your inbox and spam folder." };
    } catch (err) {
      console.error("Password reset error:", err);
      if (err.code === "auth/user-not-found") {
        // Don't reveal whether the email exists — return same success message
        return { success: true, message: "If an account exists with this email, a reset link has been sent." };
      }
      throw new HttpsError("internal", "Failed to send reset email. Please try again.");
    }
  }
);

// ────────────────────────────────────────────────────────
// 3. Create Razorpay Order
// ────────────────────────────────────────────────────────
exports.createRazorpayOrder = onCall(
  {
    region: "asia-south1",
    secrets: [razorpayKeyId, razorpayKeySecret],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be logged in to create a payment order.");
    }

    const uid = request.auth.uid;
    const { studentName, studentEmail, couponCode, ebookLeadId, ebookLeadEmail } = request.data || {};

    // ── Validate coupon (optional) ──
    // Caller may identify the redeeming e-book lead by either:
    //   (a) ebookLeadId  — the Firestore doc ID (auto-filled from /ebooks/success), OR
    //   (b) ebookLeadEmail — the email used at e-book checkout (manual entry path).
    // For (b) we look up the most recent PAID lead whose assessmentCoupon matches.
    let discountPaise = 0;
    let couponApplied = null;
    let couponLeadRef = null;
    if (couponCode && (ebookLeadId || ebookLeadEmail)) {
      const code = String(couponCode).trim().toUpperCase();
      const db = admin.firestore();

      if (ebookLeadId) {
        couponLeadRef = db.collection("ebookLeads").doc(String(ebookLeadId));
      } else {
        const email = String(ebookLeadEmail).trim().toLowerCase();
        const q = await db.collection("ebookLeads")
          .where("email", "==", email)
          .where("assessmentCoupon", "==", code)
          .where("status", "==", "paid")
          .limit(10)
          .get();
        if (q.empty) {
          throw new HttpsError("not-found", "No paid e-book purchase found for that email + coupon. Please use the exact email you entered at e-book checkout.");
        }
        // Already-redeemed leads must be filtered out (one coupon per purchase).
        const all = q.docs.map((d) => ({ id: d.id, data: d.data() }));
        const unredeemed = all
          .filter((c) => !c.data.couponRedeemedAt)
          .sort((a, b) => {
            const ta = a.data.paidAt ? a.data.paidAt.toMillis() : 0;
            const tb = b.data.paidAt ? b.data.paidAt.toMillis() : 0;
            return tb - ta;
          });
        if (!unredeemed.length) {
          // All matching leads for this email + coupon are already used.
          throw new HttpsError("failed-precondition", "This coupon has already been redeemed by this email. Each e-book purchase entitles you to one ₹500 OFF assessment redemption.");
        }
        couponLeadRef = db.collection("ebookLeads").doc(unredeemed[0].id);
      }

      const leadSnap = await couponLeadRef.get();
      if (!leadSnap.exists) throw new HttpsError("not-found", "Invalid coupon — lead not found.");
      const lead = leadSnap.data();
      if (lead.status !== "paid") throw new HttpsError("failed-precondition", "Coupon not valid (e-book payment incomplete).");
      if (String(lead.assessmentCoupon || "").toUpperCase() !== code) {
        throw new HttpsError("permission-denied", "Coupon does not match this order.");
      }
      if (lead.couponRedeemedAt) {
        throw new HttpsError("failed-precondition", "This coupon has already been used.");
      }
      discountPaise = EBOOK_COUPON_DISCOUNT_PAISE;
      couponApplied = code;
    }

    const finalAmountPaise = Math.max(0, ASSESSMENT_FEE_PAISE - discountPaise);

    try {
      const keyId = razorpayKeyId.value().trim();
      const keySecret = razorpayKeySecret.value().trim();
      console.log(`Razorpay key_id length: ${keyId.length}, starts with: ${keyId.substring(0, 12)}, key_secret length: ${keySecret.length}`);

      const Razorpay = require("razorpay");
      const rzp = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      const order = await rzp.orders.create({
        amount: finalAmountPaise,
        currency: "INR",
        receipt: `sa_${uid.substring(0, 20)}_${Date.now()}`,
        notes: {
          studentUid: uid,
          studentName: studentName || "",
          studentEmail: studentEmail || "",
          purpose: "Career Assessment Fee",
          coupon: couponApplied || "",
          ebookLeadId: (couponLeadRef && couponLeadRef.id) || ebookLeadId || "",
        },
      });

      await admin.firestore().collection("payments").doc(order.id).set({
        orderId: order.id,
        studentUid: uid,
        studentName: studentName || "",
        studentEmail: studentEmail || "",
        amount: finalAmountPaise,
        baseAmount: ASSESSMENT_FEE_PAISE,
        discountPaise,
        couponApplied,
        ebookLeadId: (couponLeadRef && couponLeadRef.id) || ebookLeadId || null,
        currency: "INR",
        status: "created",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Tentatively reserve the coupon so it can't be used in parallel
      if (couponLeadRef) {
        await couponLeadRef.update({
          couponReservedAt: admin.firestore.FieldValue.serverTimestamp(),
          couponReservedOrderId: order.id,
        });
      }

      console.log(`Razorpay order created: ${order.id} for student ${uid} (amount ₹${finalAmountPaise / 100})`);

      return {
        orderId: order.id,
        amount: finalAmountPaise,
        baseAmount: ASSESSMENT_FEE_PAISE,
        discountPaise,
        couponApplied,
        currency: "INR",
      };
    } catch (err) {
      console.error("Failed to create Razorpay order:", err);
      if (err instanceof HttpsError) throw err;
      throw new HttpsError("internal", "Failed to create payment order. Please try again.");
    }
  }
);

// ────────────────────────────────────────────────────────
// 3. Verify Razorpay Payment
// ────────────────────────────────────────────────────────
exports.verifyRazorpayPayment = onCall(
  {
    region: "asia-south1",
    secrets: [razorpayKeySecret],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be logged in to verify payment.");
    }

    const uid = request.auth.uid;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = request.data;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new HttpsError("invalid-argument", "Missing payment verification data.");
    }

    try {
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", razorpayKeySecret.value().trim())
        .update(body)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        console.error(`Payment signature mismatch for order ${razorpay_order_id}`);
        throw new HttpsError("permission-denied", "Payment verification failed. Invalid signature.");
      }

      const db = admin.firestore();

      // Read order to discover the actual paid amount + coupon
      const paySnap = await db.collection("payments").doc(razorpay_order_id).get();
      const payDoc = paySnap.exists ? paySnap.data() : {};
      const paidPaise = payDoc.amount || ASSESSMENT_FEE_PAISE;
      const couponApplied = payDoc.couponApplied || null;
      const ebookLeadId = payDoc.ebookLeadId || null;

      const batch = db.batch();

      const paymentRef = db.collection("payments").doc(razorpay_order_id);
      batch.update(paymentRef, {
        status: "paid",
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const studentRef = db.collection("students").doc(uid);
      batch.update(studentRef, {
        accessStatus: "paid",
        paymentId: razorpay_payment_id,
        paymentOrderId: razorpay_order_id,
        paymentMethod: "razorpay",
        paymentAmount: paidPaise / 100,
        couponApplied,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Lock the coupon so it can't be reused
      if (ebookLeadId && couponApplied) {
        const leadRef = db.collection("ebookLeads").doc(ebookLeadId);
        batch.update(leadRef, {
          couponRedeemedAt: admin.firestore.FieldValue.serverTimestamp(),
          couponRedeemedBy: uid,
          couponRedeemedOrderId: razorpay_order_id,
        });
      }

      await batch.commit();

      console.log(`Payment verified & access granted: ${uid}, payment: ${razorpay_payment_id}`);

      return { success: true, message: "Payment verified. Access granted!" };
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      console.error("Payment verification error:", err);
      throw new HttpsError("internal", "Payment verification failed. Please contact support.");
    }
  }
);

// ────────────────────────────────────────────────────────
// 4. Bulk Register Students (server-side — avoids client rate limits)
// ────────────────────────────────────────────────────────
exports.bulkRegisterStudents = onCall(
  {
    region: "asia-south1",
    timeoutSeconds: 300,       // 5 min for large batches
    memory: "512MiB",
  },
  async (request) => {
    // Auth check
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    // Admin check
    const callerEmail = request.auth.token.email || "";
    if (!ADMIN_EMAILS.includes(callerEmail)) {
      throw new HttpsError("permission-denied", "Only admins can bulk register students.");
    }

    const { students: studentList, organization, registrationType } = request.data;

    if (!Array.isArray(studentList) || studentList.length === 0) {
      throw new HttpsError("invalid-argument", "Students array is required.");
    }
    if (studentList.length > 200) {
      throw new HttpsError("invalid-argument", "Maximum 200 students per batch.");
    }

    const db = admin.firestore();
    const results = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const stu of studentList) {
      try {
        const { name, email, phone, password } = stu;
        if (!name || !email || !password) {
          results.push({ email: email || "unknown", success: false, error: "Missing required fields" });
          continue;
        }
        if (typeof name !== "string" || name.length > 100) {
          results.push({ email, success: false, error: "Invalid name" });
          continue;
        }
        if (!emailRegex.test(email)) {
          results.push({ email, success: false, error: "Invalid email format" });
          continue;
        }

        // Create Firebase Auth user (server-side — no client rate limits)
        const userRecord = await admin.auth().createUser({
          email,
          password,
          displayName: name,
        });

        // Create Firestore student document
        await db.collection("students").doc(userRecord.uid).set({
          name,
          email,
          phone: phone || "",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          assessmentCompleted: false,
          assessmentStartedAt: null,
          accessStatus: "approved",
          registrationType: registrationType || "school",
          organization: organization || "",
        });

        results.push({ email, success: true, uid: userRecord.uid });
      } catch (err) {
        results.push({ email: stu.email || "unknown", success: false, error: err.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(
      `Bulk registered ${successCount}/${studentList.length} students for org: ${organization || "N/A"}`
    );

    return {
      results,
      total: studentList.length,
      success: successCount,
      failed: studentList.length - successCount,
    };
  }
);

// ────────────────────────────────────────────────────────
// 5. E-BOOK FUNNEL — public, FB-ad → checkout → Razorpay → download
// ────────────────────────────────────────────────────────

/**
 * Catalog mirrored from client/src/data/ebookCatalog.ts
 * Server is the source of truth for price (security: never trust client price).
 */
const EBOOK_CATALOG = {
  health:      { title: "Health Sector Beyond NEET",        priceRupees:  99, fileSlug: "health-beyond-neet",          assessmentCoupon: "NEETFREE500" },
  fintech:     { title: "FinTech & Commerce",                priceRupees:  99, fileSlug: "fintech-and-commerce",        assessmentCoupon: "FINTECH500"  },
  future:      { title: "Future-Ready Tech & Green Careers", priceRupees: 199, fileSlug: "future-ready-tech-and-green", assessmentCoupon: "FUTURE500"   },
  engineering: { title: "Engineering & IT Careers",          priceRupees: 149, fileSlug: "engineering-and-it",          assessmentCoupon: "ENGG500"     },
  arts:        { title: "Arts & Humanities Careers",         priceRupees:  99, fileSlug: "arts-and-humanities",         assessmentCoupon: "ARTS500"     },
};

/** Generate a 7-day signed URL for the e-book HTML in Cloud Storage. */
async function generateEbookDownloadUrl(fileSlug) {
  const bucket = admin.storage().bucket();
  const file = bucket.file(`ebooks/${fileSlug}.html`);
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  return url;
}

// ─── 5a. Create Razorpay order for an e-book (PUBLIC — no auth required) ───
exports.createEbookOrder = onCall(
  {
    region: "asia-south1",
    secrets: [razorpayKeyId, razorpayKeySecret],
  },
  async (request) => {
    const { ebookKey, leadId, studentName, studentEmail, mobile } = request.data || {};
    const ebook = EBOOK_CATALOG[ebookKey];
    if (!ebook) throw new HttpsError("invalid-argument", "Unknown e-book.");
    if (!leadId) throw new HttpsError("invalid-argument", "Missing leadId.");
    if (!studentEmail || !mobile) throw new HttpsError("invalid-argument", "Missing contact details.");

    try {
      const Razorpay = require("razorpay");
      const rzp = new Razorpay({
        key_id: razorpayKeyId.value().trim(),
        key_secret: razorpayKeySecret.value().trim(),
      });

      const amountPaise = ebook.priceRupees * 100;
      const order = await rzp.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: `eb_${ebookKey}_${leadId.substring(0, 14)}`,
        notes: {
          ebookKey,
          leadId,
          studentName: studentName || "",
          studentEmail,
          mobile,
          purpose: "Srichakra E-book Purchase",
        },
      });

      // Persist payment doc + link to lead
      const db = admin.firestore();
      await db.collection("ebookPayments").doc(order.id).set({
        orderId: order.id,
        leadId,
        ebookKey,
        ebookTitle: ebook.title,
        amountPaise,
        currency: "INR",
        status: "created",
        studentName: studentName || "",
        studentEmail,
        mobile,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await db.collection("ebookLeads").doc(leadId).update({
        razorpayOrderId: order.id,
        amountPaise,
      });

      return { orderId: order.id, amount: amountPaise, currency: "INR" };
    } catch (err) {
      console.error("createEbookOrder error:", err);
      throw new HttpsError("internal", "Failed to create payment order. Please try again.");
    }
  }
);

// ─── 5b. Verify Razorpay payment, mark lead paid, generate download URL ───
exports.verifyEbookPayment = onCall(
  {
    region: "asia-south1",
    secrets: [razorpayKeySecret, gmailEmail, gmailPassword],
  },
  async (request) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, leadId } = request.data || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !leadId) {
      throw new HttpsError("invalid-argument", "Missing payment verification data.");
    }

    // 1. Verify HMAC signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", razorpayKeySecret.value().trim())
      .update(body)
      .digest("hex");
    if (expectedSignature !== razorpay_signature) {
      console.error(`E-book payment signature mismatch for ${razorpay_order_id}`);
      throw new HttpsError("permission-denied", "Payment verification failed (invalid signature).");
    }

    const db = admin.firestore();
    const paymentRef = db.collection("ebookPayments").doc(razorpay_order_id);
    const paySnap = await paymentRef.get();
    if (!paySnap.exists) throw new HttpsError("not-found", "Payment record not found.");
    const payment = paySnap.data();
    if (payment.leadId !== leadId) throw new HttpsError("permission-denied", "Lead/payment mismatch.");

    const ebook = EBOOK_CATALOG[payment.ebookKey];
    if (!ebook) throw new HttpsError("internal", "Unknown ebookKey on payment doc.");

    // 2. Generate signed download URL (7-day)
    let downloadUrl = "";
    try {
      downloadUrl = await generateEbookDownloadUrl(ebook.fileSlug);
    } catch (err) {
      console.error("Could not generate signed URL:", err);
      // continue — admin can re-issue manually
    }

    // 3. Update payment + lead
    const batch = db.batch();
    batch.update(paymentRef, {
      status: "paid",
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    batch.update(db.collection("ebookLeads").doc(leadId), {
      status: "paid",
      paymentId: razorpay_payment_id,
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      downloadUrl,
      assessmentCoupon: ebook.assessmentCoupon,
    });
    await batch.commit();

    // 4. Queue an email (handled by sendReportEmail-style worker if you wire one;
    //    for now we trigger a direct send via nodemailer)
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailEmail.value(),
          pass: gmailPassword.value(),
        },
      });
      await transporter.sendMail({
        from: `"Srichakra Academy" <${gmailEmail.value()}>`,
        to: payment.studentEmail,
        subject: `Your e-book: ${ebook.title} 📘`,
        html: `
          <div style="font-family:Segoe UI,Arial,sans-serif;color:#1a1a1a;max-width:560px;margin:auto;">
            <h2 style="color:#006D77;">Thanks for your purchase, ${payment.studentName || "there"}!</h2>
            <p>Your copy of <strong>${ebook.title}</strong> is ready.</p>
            <p>
              <a href="${downloadUrl}" style="display:inline-block;background:#006D77;color:#fff;
                padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700;">
                📘 Download your e-book
              </a>
            </p>
            <p style="color:#555;font-size:13px;">Tip: open in Chrome → Ctrl+P → Save as PDF.</p>
            <hr style="margin:22px 0;border:none;border-top:1px dashed #ccc;" />
            <p>Use the coupon below to get <strong>₹500 OFF</strong> the full Srichakra Career Assessment (₹1,599 → ₹1,099):</p>
            <p style="text-align:center;font-family:Courier New,monospace;font-size:22px;font-weight:800;
                background:#fff7e0;padding:12px 18px;border-radius:8px;letter-spacing:3px;">
              ${ebook.assessmentCoupon}
            </p>
            <p style="font-size:12px;color:#888;">Valid for 60 days. Take the assessment at srichakraacademy.org.</p>
            <p style="font-size:12px;color:#666;background:#f6f6f6;padding:8px 12px;border-radius:6px;">
              <strong>Your order reference (Lead ID):</strong>
              <code style="font-family:Courier New,monospace;">${leadId}</code><br/>
              <span style="color:#888;">Keep this for support. To redeem the coupon, you can also just use the email above (<strong>${payment.studentEmail}</strong>) — no need to type the Lead ID.</span>
            </p>
            <p style="font-size:12px;color:#888;margin-top:24px;">
              Need help? Reply to this email or call 85903 96662 / 98430 30697.
            </p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.warn("E-book email failed (lead still marked paid):", mailErr.message);
    }

    return { success: true, downloadUrl };
  }
);


// ─── 5b-bis. Re-issue / refresh an e-book download URL ───
//
// Public callable. Caller must pass leadId AND the email used at checkout.
// Works for:
//   - The success page auto-recovering when downloadUrl is empty
//   - Customers re-clicking an old expired link
//   - Admin (admin claim bypasses email check)
//
exports.refreshEbookDownloadUrl = onCall(
  { region: "asia-south1" },
  async (request) => {
    const { leadId, email } = request.data || {};
    if (!leadId) throw new HttpsError("invalid-argument", "Missing leadId.");

    const db = admin.firestore();
    const leadRef = db.collection("ebookLeads").doc(leadId);
    const snap = await leadRef.get();
    if (!snap.exists) throw new HttpsError("not-found", "Lead not found.");
    const lead = snap.data();

    if (lead.status !== "paid") {
      throw new HttpsError("failed-precondition", "Payment not completed yet.");
    }

    const isAdmin = request.auth && request.auth.token && request.auth.token.admin === true;
    if (!isAdmin) {
      const provided = String(email || "").trim().toLowerCase();
      const stored = String(lead.email || "").trim().toLowerCase();
      if (!provided || provided !== stored) {
        throw new HttpsError("permission-denied", "Email does not match this order.");
      }
    }

    const ebook = EBOOK_CATALOG[lead.ebookKey];
    if (!ebook) throw new HttpsError("internal", "Unknown e-book on lead.");

    const downloadUrl = await generateEbookDownloadUrl(ebook.fileSlug);
    await leadRef.update({
      downloadUrl,
      downloadUrlRefreshedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, downloadUrl };
  }
);



//
// Configure in Razorpay Dashboard → Settings → Webhooks:
//   URL:    https://asia-south1-srichakraacademy-3f745.cloudfunctions.net/razorpayWebhook
//   Events: payment.captured, payment.failed
//   Secret: paste any random string, then run:
//             firebase functions:secrets:set RAZORPAY_WEBHOOK_SECRET
//
exports.razorpayWebhook = onRequest(
  {
    region: "asia-south1",
    secrets: [razorpayWebhookSecret, gmailEmail, gmailPassword],
    cors: false,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const signature = req.get("x-razorpay-signature") || "";
    const expected = crypto
      .createHmac("sha256", razorpayWebhookSecret.value().trim())
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (signature !== expected) {
      console.warn("Razorpay webhook signature mismatch");
      res.status(400).send("Invalid signature");
      return;
    }

    const event = req.body && req.body.event;
    const payment = req.body && req.body.payload && req.body.payload.payment && req.body.payload.payment.entity;
    if (!event || !payment) {
      res.status(200).send("ok"); // ack — nothing to do
      return;
    }

    const orderId = payment.order_id;
    if (!orderId) {
      res.status(200).send("ok");
      return;
    }

    const db = admin.firestore();
    try {
      const payRef = db.collection("ebookPayments").doc(orderId);
      const paySnap = await payRef.get();
      if (!paySnap.exists) {
        // Not an e-book order — could be assessment payment; ignore here
        res.status(200).send("ok");
        return;
      }
      const payDoc = paySnap.data();

      if (event === "payment.captured" && payDoc.status !== "paid") {
        // Backfill: signature already validated. Generate download URL & email.
        const ebook = EBOOK_CATALOG[payDoc.ebookKey];
        let downloadUrl = "";
        try {
          if (ebook) downloadUrl = await generateEbookDownloadUrl(ebook.fileSlug);
        } catch (e) { /* ignore */ }

        const batch = db.batch();
        batch.update(payRef, {
          status: "paid",
          paymentId: payment.id,
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
          source: "webhook",
        });
        batch.update(db.collection("ebookLeads").doc(payDoc.leadId), {
          status: "paid",
          paymentId: payment.id,
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          downloadUrl,
          assessmentCoupon: ebook ? ebook.assessmentCoupon : null,
        });
        await batch.commit();

        if (ebook && payDoc.studentEmail) {
          try {
            const transporter = nodemailer.createTransport({
              service: "gmail",
              auth: { user: gmailEmail.value(), pass: gmailPassword.value() },
            });
            await transporter.sendMail({
              from: `"Srichakra Academy" <${gmailEmail.value()}>`,
              to: payDoc.studentEmail,
              subject: `Your e-book: ${ebook.title} 📘`,
              html: `
                <div style="font-family:Segoe UI,Arial,sans-serif;color:#1a1a1a;max-width:560px;margin:auto;">
                  <h2 style="color:#006D77;">Thanks for your purchase, ${payDoc.studentName || "there"}!</h2>
                  <p>Your copy of <strong>${ebook.title}</strong> is ready.</p>
                  <p style="text-align:center;margin:24px 0;">
                    <a href="${downloadUrl}" style="display:inline-block;background:#006D77;color:#fff;
                      padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
                      📘 Download your e-book
                    </a>
                  </p>
                  <p style="color:#555;font-size:13px;text-align:center;">
                    Tip: open in Chrome → Ctrl+P → Save as PDF.
                  </p>
                  <hr style="margin:22px 0;border:none;border-top:1px dashed #ccc;" />
                  <p>Use the coupon below to get <strong>₹500 OFF</strong> the full Srichakra Career Assessment (₹1,599 → ₹1,099):</p>
                  <p style="text-align:center;font-family:Courier New,monospace;font-size:22px;font-weight:800;
                      background:#fff7e0;padding:12px 18px;border-radius:8px;letter-spacing:3px;">
                    ${ebook.assessmentCoupon}
                  </p>
                  <p style="font-size:12px;color:#888;">Valid for 60 days. Take the assessment at srichakraacademy.org.</p>
                </div>
              `,
            });
          } catch (e) { console.warn("Webhook email failed:", e.message); }
        }
      } else if (event === "payment.failed") {
        await payRef.update({
          status: "failed",
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
          failureReason: payment.error_description || "unknown",
        });
        if (payDoc.leadId) {
          await db.collection("ebookLeads").doc(payDoc.leadId).update({ status: "payment_failed" });
        }
      }

      res.status(200).send("ok");
    } catch (err) {
      console.error("razorpayWebhook error:", err);
      res.status(500).send("error");
    }
  }
);
// ──────────────────────────────────────────────────────────────────
// 6. Counselling (post-assessment 1:1) — ₹1,399
// ──────────────────────────────────────────────────────────────────
exports.createCounsellingOrder = onCall(
  {
    region: "asia-south1",
    secrets: [razorpayKeyId, razorpayKeySecret],
  },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Login required.");
    const uid = request.auth.uid;
    const { studentName, studentEmail, mobile, slot } = request.data || {};

    try {
      const Razorpay = require("razorpay");
      const rzp = new Razorpay({
        key_id: razorpayKeyId.value().trim(),
        key_secret: razorpayKeySecret.value().trim(),
      });

      const order = await rzp.orders.create({
        amount: COUNSELLING_FEE_PAISE,
        currency: "INR",
        receipt: `co_${uid.substring(0, 16)}_${Date.now()}`,
        notes: { studentUid: uid, purpose: "Counselling 1:1", slot: slot || "" },
      });

      await admin.firestore().collection("counsellingBookings").doc(order.id).set({
        orderId: order.id,
        studentUid: uid,
        studentName: studentName || "",
        studentEmail: studentEmail || "",
        mobile: mobile || "",
        preferredSlot: slot || "",
        amount: COUNSELLING_FEE_PAISE,
        currency: "INR",
        status: "created",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { orderId: order.id, amount: COUNSELLING_FEE_PAISE, currency: "INR" };
    } catch (err) {
      console.error("createCounsellingOrder failed:", err);
      throw new HttpsError("internal", "Could not create counselling order.");
    }
  }
);

exports.verifyCounsellingPayment = onCall(
  {
    region: "asia-south1",
    secrets: [razorpayKeySecret, gmailEmail, gmailPassword],
  },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Login required.");
    const uid = request.auth.uid;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = request.data || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new HttpsError("invalid-argument", "Missing payment data.");
    }

    const expected = crypto
      .createHmac("sha256", razorpayKeySecret.value().trim())
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");
    if (expected !== razorpay_signature) {
      throw new HttpsError("permission-denied", "Signature verification failed.");
    }

    const db = admin.firestore();
    const ref = db.collection("counsellingBookings").doc(razorpay_order_id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError("not-found", "Booking not found.");
    const booking = snap.data();
    if (booking.studentUid !== uid) throw new HttpsError("permission-denied", "Booking mismatch.");

    await ref.update({
      status: "paid",
      paymentId: razorpay_payment_id,
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify admin + cc student
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailEmail.value(), pass: gmailPassword.value() },
      });
      await transporter.sendMail({
        from: `"Srichakra Academy" <${gmailEmail.value()}>`,
        to: gmailEmail.value(),
        cc: booking.studentEmail || undefined,
        subject: `New Counselling Booking — ${booking.studentName || uid}`,
        html: `
          <div style="font-family:Segoe UI,Arial,sans-serif;color:#1a1a1a;max-width:560px;">
            <h2 style="color:#006D77;">Counselling session booked ✅</h2>
            <p>Hi ${booking.studentName || "Student"},</p>
            <p>Thanks for booking a 1:1 career counselling session.
              Our counsellor will contact you within <strong>24 hours</strong> on
              <strong>${booking.mobile || "your registered mobile"}</strong> to schedule
              your session.</p>
            <ul style="background:#f6fafa;padding:14px 18px;border-radius:8px;line-height:1.8;">
              <li><b>Name:</b> ${booking.studentName || "—"}</li>
              <li><b>Email:</b> ${booking.studentEmail || "—"}</li>
              <li><b>Mobile:</b> ${booking.mobile || "—"}</li>
              <li><b>Preferred slot:</b> ${booking.preferredSlot || "—"}</li>
              <li><b>Amount paid:</b> ₹${COUNSELLING_FEE_PAISE / 100}</li>
              <li><b>Order ID:</b> ${razorpay_order_id}</li>
            </ul>
            <p style="font-size:12px;color:#888;">For any changes call 85903 96662 / 98430 30697.</p>
          </div>
        `,
      });
    } catch (e) { console.warn("Counselling email failed:", e.message); }

    return { success: true };
  }
);
