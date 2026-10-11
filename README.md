# UFC, the USAR FOSS Club

Build. Break. Collaborate. Repeat.

![UFC Banner](./yohoho.jpeg)

This is the code for the website of UFC, the open source club at the University School of Automation and Robotics (USAR), GGSIPU. It is a student run club, backed by [FOSS United](https://fossunited.org/c/university-school-of-automation-and-robotics), and this website is one of the things we build together. If you found a typo, a bug or something that could be nicer, you are exactly who this repo is for.

## Why the club exists

In 2025 Siddharth and a few friends noticed that plenty of people at USAR could code, but most of it stayed on their own laptops. Nobody on campus was making open source the main thing. So they started a club for it, and other people turned up.

We keep the philosophy short on purpose. There are four things we care about, and the rest of what we do comes from them.

1. **Everyone is invited.** Developers, designers, hardware tinkerers, writers, organisers and total beginners. Open source gets better with every kind of person in it, so we make room on purpose.
2. **No proprietary master.** No company, sponsor or single person owns the club. We pick our own projects, make our own rules and share what we make.
3. **No hierarchy that matters.** Somebody has to run the group chat and book the rooms, but titles do not decide whose idea wins. A first-year's pull request gets the same review as anyone else's.
4. **Spread the word.** Most students have never heard of open source, or assume it is not for them. We run workshops, talks and events, and have a lot of conversations, so more people know it is for them too.

If something helps the project or the people around it, we count it as a contribution. That includes code, but it also includes a poster, a doc fix, a good question, a soldered board or a well run event.

## How the website explains us

The site is not a brochure with a list of features. It tries to explain the club the way we would explain it to a friend, and it follows a few rules.

**Plain, human words.** We write in the first person plural and keep the tone friendly. No corporate phrases, no hype, no long manifesto. If a sentence sounds like a press release, we rewrite it. We also avoid em dashes and emojis in the copy, because they make it read like it was written by a machine.

**One idea per section.** The home page is a single scroll, and each chapter has one job.

| Chapter        | What it says                                                                                                                                                                                          |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Premise        | The four freedoms of free software (run, study, share, improve), numbered 0 to 3 like a programmer would, each one paired with something the club actually does about it.                             |
| The bazaar     | Eric Raymond's cathedral and bazaar: closed software is built by a few people behind doors, open software by everyone who turns up. And the people who turned up first were never one type of person. |
| The big tent   | Open source needs designers, writers, hardware people and beginners, not only programmers. Pick what sounds like you.                                                                                 |
| The log        | A clothesline of the things we have run so far, from Genesis to Build with TRAE, so the history is easy to see.                                                                                       |
| The core leads | The students who keep the community alive, shown as a wall of photos with a short note each.                                                                                                          |
| The workshop   | The projects the community is proudest of, shown one by one, with who built them and where to find them.                                                                                              |
| The zoo        | The mascots and logos of the open source world, as stickers you can grab and throw around.                                                                                                            |
| The invitation | Where to join us.                                                                                                                                                                                     |

**Show, do not only tell.** The design is a scrapbook on purpose. Tape, polaroids, sticky notes and stickers say that this is a club made by people, not a company. Several pieces are interactive, such as the stickers you can drag and the thread that follows you down the About page. They are there to be fun, and the text still works without them.

**Be honest about the size.** We are one year old. The About page tells the story as it happened, including the parts where we were just a few friends with a group chat. The Achievements page says plainly where members have ended up, such as GSoC, FOSS United, DRDO and OWASP.

**Everyone can find a way in.** Pages end with something a newcomer can do next, whether that is joining the chat, reading about an event or opening a pull request.

## What is in the site

- **Home, About, Events, Achievements.** The public pages. Each event also has its own page.
- **Dashboard.** For members who sign in with GitHub: an overview, a leaderboard, an activity feed, the member list, event proposals and settings.

## Tech

- Next.js 16 (App Router) with React 19 and TypeScript
- Tailwind CSS 4, plus a hand written design system in `src/components/home/home.css`
- Framer Motion for animation, Lenis for smooth scrolling and Matter.js for the sticker physics
- next-auth with GitHub OAuth
- Prisma 7 with PostgreSQL
- Upstash Redis for caching and live updates, and Upstash QStash for background jobs

## Running it locally

You need Node.js and a PostgreSQL database. A Neon or Supabase database works fine.

```bash
git clone https://github.com/USAR-FOSS/ufc_website.git
cd ufc_website
npm install
cp .env.example .env
```

Fill in `.env`. The file has a comment next to every value that explains where to get it. The only things you must create yourself are a database, a [GitHub OAuth app](https://github.com/settings/developers) with the callback `http://localhost:3000/api/auth/callback/github`, and a random secret. Then:

```bash
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The public pages work without any of the Upstash keys. They are only needed for the dashboard's caching and background sync.

### Background sync (optional)

The dashboard keeps GitHub and LeetCode numbers up to date through [Upstash QStash](https://upstash.com/docs/qstash). To try it locally, run this in a second terminal and copy the credentials it prints into your `.env`:

```bash
npx @upstash/qstash-cli dev
```

Set `NEXTAUTH_URL=http://localhost:3000` too, then restart `npm run dev`. Without QStash everything else still works.

### Useful commands

| Command                 | What it does                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `npm run dev`           | Start the dev server                                                               |
| `npm run build`         | Generate the Prisma client and make a production build                             |
| `npm run lint`          | Run ESLint. It should finish with no warnings                                      |
| `npm run format`        | Format everything with Prettier                                                    |
| `npm run db:seed`       | Add five fake members so the leaderboard has something to show                     |
| `npm run db:unseed`     | Remove those fake members again                                                    |
| `npm run jobs:schedule` | Create the repeating background jobs in QStash (run it against your deployed site) |

## Contributing

We would love your help, and you do not need to be an expert.

1. Fork [USAR-FOSS/ufc_website](https://github.com/USAR-FOSS/ufc_website) and clone your fork.
2. Create a branch with `git checkout -b my-change`.
3. Make your change. Run `npm run lint` before you commit.
4. Push the branch and open a pull request. Tell us what you changed and why, in your own words.

A few things that make a pull request easy to review:

- Keep it small. One idea per pull request.
- Match the tone of the existing copy if you change any text.
- If you add an image, make sure you are allowed to use it, and tell us where it came from.
- Not sure where to start? Ask in the Discord and someone will point you at something.

## Come hang out

- [WhatsApp community](https://chat.whatsapp.com/CyN8KlKDUfh8zmzp5VYGSh)
- [Discord](https://discord.com/invite/7HrTYAUpdd)
- [Instagram](https://www.instagram.com/foss_usar/)
- [GitHub organisation](https://github.com/USAR-FOSS)

Whether you are a beginner or have been doing this for years, you are welcome here.

## License

The code is released under the [Apache License 2.0](./LICENSE).

If you reuse our code, components or design, please keep the [NOTICE](./NOTICE) file and give UFC credit somewhere visible, such as your README or footer. It is a small thing and it helps more people find the club.

The license covers our code and the original artwork we drew. It does not cover the third party mascots and logos used as stickers, company logos, or photos of our members and events. Those have their own owners and licenses, and [NOTICE](./NOTICE) explains which is which. Every third party image, with its creator and license, is listed in [third_party.md](./third_party.md).
