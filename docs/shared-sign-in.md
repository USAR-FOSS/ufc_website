# Shared sign in

One login for every club app. People sign in once with GitHub at the club's sign in service (`oidc.fossclub.tech`, the separate `OIDC`
project), and every app that uses it recognises them without asking again. This site is one of those apps.

It is a switch. With `OIDC_LOGIN` unset the site signs people in with GitHub directly, exactly as it always did.

## What changes when it is on

1. The sign in button sends people to the shared service. If they already have a session there (from this site or any other club app) they
   come straight back, signed in.
2. Back on this site, the member is matched by their **GitHub id** (the `github_id` claim), never by a username.
3. If that member already has a usable GitHub connection stored, that is the whole sign in.
4. If not (a brand new member, or one whose stored GitHub connection ran out), the site sends them through GitHub once more, with their
   username suggested. GitHub does not ask again for someone who already allowed the app, so it is a quick redirect. This step is what stores
   the token the site uses for their stats, and it creates the profile of someone new.
5. Signing out clears the site's session and then asks the shared service to end its session too.

The shared service never gives a GitHub token to any app. That is why step 4 exists: the stats need one.

## Existing sessions

Nobody is signed out when the switch is turned on. Sessions made with GitHub sign in keep working until they expire (seven days). The next
time someone signs in, they go through the shared service.

## Settings

| Variable             | Value                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OIDC_ISSUER`        | `https://oidc.fossclub.tech`                                                                                                                            |
| `OIDC_CLIENT_ID`     | `fossclub-site`, as registered in the sign in service's `clients.json`                                                                                  |
| `OIDC_CLIENT_SECRET` | The secret set for it there (`CLIENT_SECRET_FOSSCLUB_SITE`)                                                                                             |
| `OIDC_LOGIN`         | `on` to use it. Remove it (or anything else) to go back to GitHub sign in at once. If a setting above is missing, the site logs it and stays on GitHub. |

The callback address registered for this site in the sign in service is `https://<site>/api/auth/callback/fossclub`.

## Turning it on

1. Add `OIDC_ISSUER`, `OIDC_CLIENT_ID` and `OIDC_CLIENT_SECRET` to Vercel and deploy. Nothing changes yet.
2. Add `OIDC_LOGIN=on` and redeploy. Try signing in with an account of yours, and signing out.
3. To go back: remove `OIDC_LOGIN` and redeploy.
