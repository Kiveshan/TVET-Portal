import type { SubmissionStatus } from '@/components/StatusBadge';
import type { Submission, SubmissionReview } from '@/types/submission';

// Mock store for DHET decisions until the backend exists. Kept in sessionStorage so it
// survives signing out and in as another user in the same tab, and resets when the tab closes.

const STORAGE_KEY = 'tvet-portal.reviews';

type ReviewsByFile = Record<string, SubmissionReview>;

function load(): ReviewsByFile {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReviewsByFile) : {};
  } catch {
    return {};
  }
}

let reviews: ReviewsByFile = load();
const listeners = new Set<() => void>();

export const reviewStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): ReviewsByFile {
    return reviews;
  },
  save(review: SubmissionReview) {
    reviews = { ...reviews, [review.fileName]: review };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    } catch {
      // Storage blocked or full: the decision still shows until the page is reloaded.
    }
    listeners.forEach((listener) => listener());
  },
};

/** A submission's status after any DHET decision recorded here. */
export function statusAfterReview(submission: Submission, all: ReviewsByFile): SubmissionStatus {
  return all[submission.fileName]?.status ?? submission.status;
}
