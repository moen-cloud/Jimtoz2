import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Check, Star } from "lucide-react";
import toast from "react-hot-toast";
import Reveal from "../components/Reveal.jsx";
import api from "../api/axios.js";

const steps = ["received", "confirmed", "baking", "ready", "completed"];

const OrderTracking = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then((res) => setOrder(res.data))
      .catch(() => setError("We couldn't find that order. Double check the link and try again."));
  }, [id]);

  if (error) {
    return <div className="bg-cream min-h-[60vh] flex items-center justify-center text-cocoa-500">{error}</div>;
  }

  if (!order) {
    return <div className="bg-cream min-h-[60vh] flex items-center justify-center text-cocoa-400">Loading order...</div>;
  }

  const currentStepIndex = steps.indexOf(order.status);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Please write a few words about your order");
      return;
    }
    setSubmittingReview(true);
    try {
      await api.post("/reviews", {
        name: order.guestName || order.user?.name || "Jimtoz Customer",
        rating,
        comment: comment.trim(),
      });
      toast.success("Thanks for your review! It'll appear once approved.");
      setReviewSubmitted(true);
    } catch {
      toast.error("Couldn't submit your review, please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="bg-cream min-h-screen py-16">
      <div className="container-page max-w-2xl">
        <Reveal>
          <p className="uppercase tracking-[0.25em] text-mustard-600 text-xs font-semibold mb-2 text-center">
            Order #{order._id.slice(-6).toUpperCase()}
          </p>
          <h1 className="text-3xl text-center mb-10">Tracking Your Order</h1>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="bg-white rounded-5xl shadow-soft p-8">
            {order.status === "cancelled" ? (
              <p className="text-center text-red-500 font-semibold">This order was cancelled.</p>
            ) : (
              <div className="flex justify-between relative">
                <div className="absolute top-4 left-0 right-0 h-1 bg-mustard-100 rounded-full -z-10" />
                <div
                  className="absolute top-4 left-0 h-1 bg-mustard-500 rounded-full -z-10 transition-all duration-700"
                  style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                />
                {steps.map((step, i) => (
                  <div key={step} className="flex flex-col items-center gap-2 flex-1">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                        i <= currentStepIndex
                          ? "bg-mustard-500 border-mustard-500 text-cocoa-800"
                          : "bg-white border-mustard-200 text-mustard-200"
                      }`}
                    >
                      {i <= currentStepIndex ? <Check size={16} /> : <span className="text-xs">{i + 1}</span>}
                    </div>
                    <span className="text-xs capitalize text-cocoa-600 text-center">{step}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-10 border-t border-mustard-100 pt-6 space-y-4">
              {order.items?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-cocoa-400 mb-2">Your Items</p>
                  <ul className="text-sm text-cocoa-600 space-y-1">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex justify-between">
                        <span>{item.quantity}× {item.name}</span>
                        <span>KES {(item.price * item.quantity).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {order.customCake?.isCustom && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-cocoa-400 mb-2">
                    Your Custom Cake
                  </p>
                  <ul className="text-sm text-cocoa-600 space-y-1">
                    <li>Flavor: {order.customCake.flavor}</li>
                    <li>Size: {order.customCake.size}</li>
                    <li>Tiers: {order.customCake.tiers}</li>
                    <li>Occasion: {order.customCake.occasion}</li>
                    {order.customCake.message && <li>Message: "{order.customCake.message}"</li>}
                    {order.customCake.neededBy && (
                      <li>Needed by: {new Date(order.customCake.neededBy).toLocaleDateString()}</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="text-sm text-cocoa-600 space-y-2 pt-2 border-t border-mustard-100">
                <p>
                  <span className="font-semibold">Total:</span> KES {order.totalPrice?.toLocaleString()}
                </p>
                <p>
                  <span className="font-semibold">Payment method:</span>{" "}
                  {order.paymentMethod === "mpesa" ? "M-Pesa" : order.paymentMethod === "card" ? "Card" : "Cash"}
                </p>
                <p>
                  <span className="font-semibold">Fulfillment:</span> {order.fulfillment?.type || "pickup"}
                </p>
                {order.fulfillment?.scheduledDate && (
                  <p>
                    <span className="font-semibold">Scheduled:</span>{" "}
                    {new Date(order.fulfillment.scheduledDate).toLocaleDateString()} {order.fulfillment.scheduledTime}
                  </p>
                )}
                <p>
                  <span className="font-semibold">Placed:</span> {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {order.status === "completed" && (
          <Reveal delay={0.15} className="mt-6">
            <div className="bg-white rounded-5xl shadow-soft p-8">
              {reviewSubmitted ? (
                <p className="text-center text-cocoa-600">
                  🎉 Thanks for sharing! Your review is awaiting approval and will appear on our site soon.
                </p>
              ) : (
                <>
                  <h2 className="font-display text-xl text-cocoa-800 mb-1">How was your order?</h2>
                  <p className="text-sm text-cocoa-500 mb-5">Let other customers know what you thought.</p>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(n)}
                          aria-label={`${n} star${n > 1 ? "s" : ""}`}
                          className="text-mustard-500"
                        >
                          <Star size={28} fill={n <= rating ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      required
                      rows={4}
                      placeholder="Tell us about the taste, freshness, packaging, pickup experience..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full rounded-2xl border border-mustard-200 bg-white px-4 py-3 text-cocoa-700 focus:outline-none focus:ring-2 focus:ring-mustard-400"
                    />
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="rounded-full bg-mustard-500 hover:bg-mustard-400 text-cocoa-800 font-semibold text-sm px-6 py-3 transition-colors disabled:opacity-60"
                    >
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;