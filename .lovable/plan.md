I confirmed the popup is still loading old stored `source.unsplash.com` URLs from the database for the Parent topic, and those requests are failing. The code generator was updated to use Loremflickr, but already-seeded topics kept the broken old URLs, so the UI only shows gray boxes.

Plan:

1. Re-seed existing broken image rows
   - Update all existing `topic_images` rows whose URL starts with the deprecated `source.unsplash.com` endpoint.
   - Replace them with fresh, topic-relevant working URLs using the same topic/category keyword logic.
   - Preserve existing rows/IDs where possible so any future ratings remain attached, but swap the broken URL values.

2. Add automatic recovery in the app
   - Update `useTopicImages` so if a topic already has candidate images but all/most are old broken Unsplash URLs, it automatically refreshes them to the current working source.
   - This prevents the same gray-popup issue from returning for any topic that was seeded before the source change.

3. Improve the ranking popup fallback UX
   - Instead of hiding failed images and leaving blank gray cards, show a visible fallback message/state on each failed tile.
   - Keep the rating controls available only when an actual candidate is selected, but make failures obvious rather than invisible.

4. Verify on the current topic
   - Open `/topic/Parent`, launch the ranking popup, and confirm real images load instead of gray boxes.
   - Check network requests to confirm the old `source.unsplash.com` image URLs are no longer being requested for this topic.