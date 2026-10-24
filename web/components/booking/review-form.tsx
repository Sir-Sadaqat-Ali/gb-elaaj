"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { reviewSchema, type ReviewInput } from "@/lib/validation/booking";
import { createReviewAction, updateReviewAction } from "@/lib/actions/reviews";

export function ReviewForm({
  appointmentId,
  mode = "create",
  initialRating = 5,
  initialText = "",
}: {
  appointmentId: string;
  mode?: "create" | "edit";
  initialRating?: number;
  initialText?: string;
}) {
  const isEdit = mode === "edit";
  const [pending, start] = React.useTransition();
  const [rating, setRating] = React.useState(initialRating);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { appointmentId, rating: initialRating, text: initialText },
  });

  const onSubmit = (values: ReviewInput) => {
    start(async () => {
      const res = isEdit
        ? await updateReviewAction({ ...values, rating })
        : await createReviewAction({ ...values, rating });
      if (res && !res.ok) toast.error(res.error);
      else toast.success(isEdit ? "Review updated." : "Review submitted. Thank you!");
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register("appointmentId")} />
      <div>
        <div className="mb-2 text-[13px] font-medium text-ge-ink">Rating</div>
        <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              onClick={() => setRating(n)}
              className="rounded-md p-1 hover:bg-ge-soft-bg"
            >
              <Star
                className={`h-7 w-7 ${n <= rating ? "fill-current text-[color:var(--ge-warning)]" : "text-ge-border"}`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-ge-muted">{rating} / 5</span>
        </div>
      </div>
      <Field label="Tell others about your experience" hint="Optional, max 2000 characters">
        <Textarea rows={5} placeholder="Was the doctor punctual? Did they explain things clearly?" {...register("text")} />
      </Field>
      {errors.text?.message && <p className="text-xs text-ge-danger">{errors.text.message}</p>}
      <Button type="submit" loading={pending}>{isEdit ? "Update review" : "Submit review"}</Button>
    </form>
  );
}
