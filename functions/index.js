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

// ─── Assessment fee in paise (₹2,999 = 299900 paise) ───
const ASSESSMENT_FEE_PAISE = 299900;

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
// 2. Create Razorpay Order
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
    const { studentName, studentEmail } = request.data;

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
        amount: ASSESSMENT_FEE_PAISE,
        currency: "INR",
        receipt: `sa_${uid.substring(0, 20)}_${Date.now()}`,
        notes: {
          studentUid: uid,
          studentName: studentName || "",
          studentEmail: studentEmail || "",
          purpose: "Career Assessment Fee",
        },
      });

      await admin.firestore().collection("payments").doc(order.id).set({
        orderId: order.id,
        studentUid: uid,
        studentName: studentName || "",
        studentEmail: studentEmail || "",
        amount: ASSESSMENT_FEE_PAISE,
        currency: "INR",
        status: "created",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Razorpay order created: ${order.id} for student ${uid}`);

      return {
        orderId: order.id,
        amount: ASSESSMENT_FEE_PAISE,
        currency: "INR",
      };
    } catch (err) {
      console.error("Failed to create Razorpay order:", err);
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
        paymentAmount: ASSESSMENT_FEE_PAISE / 100,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
      });

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
    if (callerEmail !== "admin@srichakraacademy.org") {
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

    for (const stu of studentList) {
      try {
        const { name, email, phone, password } = stu;
        if (!name || !email || !password) {
          results.push({ email: email || "unknown", success: false, error: "Missing required fields" });
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
