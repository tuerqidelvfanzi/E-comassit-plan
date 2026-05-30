import { describe, expect, it } from 'vitest';
import {
  ListingStatus,
  PublishTaskStatus,
  canTransitionPublishTask,
  mapProductStatusToListing,
} from './status.js';

describe('listing status', () => {
  it('maps product lifecycle to listing status', () => {
    expect(mapProductStatusToListing('raw')).toBe(ListingStatus.Pending);
    expect(mapProductStatusToListing('ready')).toBe(ListingStatus.Reviewing);
    expect(mapProductStatusToListing('published')).toBe(ListingStatus.Live);
  });

  it('allows valid publish task transitions', () => {
    expect(canTransitionPublishTask(PublishTaskStatus.Draft, PublishTaskStatus.Pending)).toBe(true);
    expect(canTransitionPublishTask(PublishTaskStatus.Pending, PublishTaskStatus.Filling)).toBe(true);
    expect(canTransitionPublishTask(PublishTaskStatus.Filling, PublishTaskStatus.Completed)).toBe(true);
  });

  it('rejects invalid publish task transitions', () => {
    expect(canTransitionPublishTask(PublishTaskStatus.Completed, PublishTaskStatus.Pending)).toBe(false);
    expect(canTransitionPublishTask(PublishTaskStatus.Draft, PublishTaskStatus.Completed)).toBe(false);
  });
});
