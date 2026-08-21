/**
 * Builds the canonical user-facing 21st.dev component page — the browsable page a reviewer
 * opens to "look at the component". Deliberately NOT the shadcn registry endpoint
 * (`https://21st.dev/r/<author>/<slug>`, which serves install JSON): the human-facing page
 * lives at `https://21st.dev/@<author>/components/<slug>`.
 *
 * Root cause of the 404s this replaces: the pattern references hardcoded a `/pattern/<slug>`
 * path that 21st.dev has never served, so every "Grounded in" link resolved to a 404.
 * Deriving the URL from structured author + slug fields keeps the one true URL shape in a
 * single place, so it can't drift back out of sync per-reference.
 */
export function twentyFirstComponentUrl(author: string, slug: string): string {
  return `https://21st.dev/@${author}/components/${slug}`;
}

