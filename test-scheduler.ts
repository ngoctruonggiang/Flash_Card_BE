import { AnkiScheduler, SchedulerCard } from './src/services/scheduler';

const scheduler = new AnkiScheduler();

function test(
  name: string,
  input: SchedulerCard,
  rating: 'Again' | 'Hard' | 'Good' | 'Easy',
  expected: Partial<SchedulerCard>,
) {
  console.log(`Testing: ${name}`);
  const result = scheduler.calculateNext(input, rating);

  let passed = true;
  if (expected.status && result.status !== expected.status) {
    console.error(
      `  Failed Status: Expected ${expected.status}, got ${result.status}`,
    );
    passed = false;
  }
  if (
    expected.interval !== undefined &&
    Math.round(result.interval) !== Math.round(expected.interval)
  ) {
    console.error(
      `  Failed Interval: Expected ${expected.interval}, got ${result.interval}`,
    );
    passed = false;
  }
  if (
    expected.stepIndex !== undefined &&
    result.stepIndex !== expected.stepIndex
  ) {
    console.error(
      `  Failed StepIndex: Expected ${expected.stepIndex}, got ${result.stepIndex}`,
    );
    passed = false;
  }

  if (passed) console.log('  PASSED');
  else console.log('  FAILED');
}

// 1. New Card -> Learning
test(
  'New Card -> Again',
  { status: 'new', stepIndex: 0, easeFactor: 2.5, interval: 0 },
  'Again',
  { status: 'learning', stepIndex: 0, interval: 1 },
);

test(
  'New Card -> Good',
  { status: 'new', stepIndex: 0, easeFactor: 2.5, interval: 0 },
  'Good',
  { status: 'learning', stepIndex: 1, interval: 10 },
);

test(
  'New Card -> Easy',
  { status: 'new', stepIndex: 0, easeFactor: 2.5, interval: 0 },
  'Easy',
  { status: 'review', stepIndex: 0, interval: 4 },
);

// 2. Learning Card
test(
  'Learning (Step 1) -> Good',
  { status: 'learning', stepIndex: 1, easeFactor: 2.5, interval: 10 },
  'Good',
  { status: 'review', stepIndex: 0, interval: 1 },
);

test(
  'Learning (Step 1) -> Again',
  { status: 'learning', stepIndex: 1, easeFactor: 2.5, interval: 10 },
  'Again',
  { status: 'learning', stepIndex: 0, interval: 1 },
);

// 3. Review Card
test(
  'Review -> Good',
  { status: 'review', stepIndex: 0, easeFactor: 2.5, interval: 1 },
  'Good',
  { status: 'review', interval: 2.5 }, // 1 * 2.5 = 2.5 -> rounds to 2 or 3 with fuzz, but base calc is 2.5
);

test(
  'Review -> Hard',
  { status: 'review', stepIndex: 0, easeFactor: 2.5, interval: 10 },
  'Hard',
  { status: 'review', interval: 12 }, // 10 * 1.2 = 12
);

test(
  'Review -> Again',
  { status: 'review', stepIndex: 0, easeFactor: 2.5, interval: 10 },
  'Again',
  { status: 'relearning', stepIndex: 0, interval: 10 }, // Relearning step 10m
);
