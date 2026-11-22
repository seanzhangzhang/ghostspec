/**
 * Example: haunted-legacy.ts
 *
 * This file intentionally contains the kinds of issues GhostSpec detects:
 * silent catches, magic numbers, deep property access without null checks,
 * and high-complexity functions. It is NOT production code — it is a demo target.
 */

// Magic numbers scattered throughout
const TIMEOUT = 3000;

export async function fetchUserData(userId: string): Promise<any> {
  try {
    const response = await fetch(`https://api.example.com/users/${userId}`);
    const data = await response.json();
    // Deep property access without optional chaining
    return data.user.profile.preferences.theme;
  } catch (e) {
    // 👻 Silent catch — the error disappears into the void
  }
}

export function processPayment(amount: number, card: any): boolean {
  // Magic numbers
  if (amount > 9999) {
    return false;
  }

  if (card.details.billing.zip.length !== 5) {
    return false;
  }

  // High complexity — multiple nested branches
  if (amount > 0) {
    if (card.type === 'visa') {
      if (amount > 500) {
        if (card.details.expiry !== null) {
          if (card.details.cvv.length === 3) {
            return true;
          }
        }
      } else {
        return true;
      }
    } else if (card.type === 'mastercard') {
      if (amount > 1000) {
        return card.details.verified;
      }
      return true;
    }
  }

  return false;
}

export async function sendNotification(userId: string, message: string): Promise<void> {
  // Async without error handling
  const user = await fetchUserData(userId);
  await fetch('/api/notify', {
    method: 'POST',
    body: JSON.stringify({ to: user, message, retries: 3 }),
  });
}

function internalHelper(x: number): number {
  // Magic numbers
  return x * 1.08 + 42;
}
