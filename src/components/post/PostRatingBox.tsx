import UserRatingIndicator from "@/components/UserRatingIndicator";

interface PostRatingBoxProps {
  postId: string;
  averageRating: number;
  ratingCount: number;
  onRatingChanged?: () => void;
}

const PostRatingBox = ({ postId, averageRating, ratingCount, onRatingChanged }: PostRatingBoxProps) => (
  <div className="shrink-0 flex items-stretch rounded-lg border border-border bg-card px-3 py-2 gap-3 min-w-[180px]">
    <div className="flex-1 flex flex-col items-center justify-center">
      <span className="text-xs font-medium text-muted-foreground">Rank</span>
      <span className="text-secondary font-bold tabular-nums text-2xl leading-none mt-0.5">
        {ratingCount > 0 ? averageRating : "—"}
      </span>
    </div>
    <div className="w-px self-stretch bg-border" aria-hidden />
    <div className="flex-1 flex flex-col items-center justify-center">
      <span className="text-xs font-medium text-muted-foreground">You</span>
      <div className="mt-0.5 flex items-center justify-center min-h-[1.75rem]">
        <UserRatingIndicator postId={postId} onRatingChanged={onRatingChanged} size="lg" />
      </div>
    </div>
  </div>
);

export default PostRatingBox;
