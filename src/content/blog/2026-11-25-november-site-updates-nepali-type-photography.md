---
title: "November Updates: New Projects, a Photography Page, and How I Work"
description: "A November roundup: Nepali Type and other projects I launched, a new photography page, how I use Claude Code in my daily work, and what I have been building at NCCS and MathUplift."
date: 2026-11-25
tags: ["site", "nepali-type", "photography", "claude-code", "work"]
---

November was a busy month — new projects went live, this site got a lot of work, and I changed how I do my day-to-day development. Here is the roundup.

## Nepali Type

[Nepali Type](https://nepali-type.pages.dev) is a free Nepali typing app that runs completely in your browser. No sign-up, no tracking, nothing to install.

What it does:

- **Romanized typing** — type Nepali words in English letters and get proper Nepali text, backed by a dictionary of 4,000+ words
- **Classic Preeti layout** — the old font-keys layout many of us learned on, for those who still type that way
- **Three outputs** — Unicode, Romanized and Preeti, so you can copy the text wherever you need it
- **Chart and cheatsheet** — a quick reference for the key mappings
- **Works offline** — it is a PWA, so after the first load it keeps working without internet

I should be honest about how it was built: most of the code was written by Claude, an AI assistant, working from my prompts. I planned the features, tested everything and fixed what felt wrong, but I did not hand-write the code. More on that below.

The code is open source (MIT) on [GitHub](https://github.com/ChandanShakya/nepali-type), and the app itself is at [nepali-type.pages.dev](https://nepali-type.pages.dev).

## Photography page

The site now has a [photography page](/photography/). It holds my photos and digital art, and you can filter them two ways: by the device that took them, and by kind (photo or digital art).

Devices on there right now:

- Samsung Galaxy S23 Ultra — my main camera
- Redmi Note 10S — my old phone
- iPhone 4s — the jailbroken one I use as a music player
- Canon SX210 IS — my dad's camera, CHDK modified

Under the hood, photos are managed through Sveltia CMS, converted to WebP at build time, lazy loaded, and the page loads more as you scroll. Only a few photos are up so far — more will come as I go through my gallery.

## How I work now: Claude Code

Most of my development these days happens by prompting AI agents instead of typing every line myself. Claude Code is the one I lean on most, with OpenCode as the second tool. My editor is Zed, and I still drop into Neovim when I feel like it.

The way it works in practice: I describe what needs to be built, the agent writes the code, and I review, test and correct it. It is fast — noticeably faster than writing everything by hand — and it is how Nepali Type got built, and how a good chunk of my work code gets written too.

At the same time, I do not want the tool to become a crutch. I have started working through the fundamentals properly — PHP, JavaScript, SQL, algorithms — writing code by hand without AI help, at my own pace. The goal is simple: use AI because it is fast, not because I cannot do without it.

## Work: NCCS and MathUplift

My days are at **NCCS Software**, where I have been a Laravel developer since December 2023. The work is mostly student management systems for schools and colleges — upgrading legacy systems, porting older .NET applications to Laravel, and building Livewire components. I am a primary contributor on several of our systems, including the Bachelors student management system and the continuous assessment system our +2 programs run on.

In the evenings I work on contract for **MathUplift**, a math learning platform. I own most of the dashboard work there — role-based dashboards for students, teachers and admins, progress charts, streaks and medals to keep students engaged — and the Stripe billing side: checkout, renewals, past-due retries and cancellations. Daily meetings, remote, and a lot of Blade and Livewire.

## Other projects I launched

Besides Nepali Type, these went live or joined the site recently — most of them you can open and use right now:

- [Stardew Farm Planner](https://stardew.chandanshakya.com.np) — plan your Stardew Valley farm layout in the browser
- [Family Tree](https://family.chandanshakya.com.np) — a small genealogy app for building family trees
- [Pixel8](https://pixel8.chandanshakya.com.np) — a pixel art gallery
- [FuelLog](https://fuellog.chandanshakya.com.np) — an offline fuel and EV charge tracker for Android
- [GoldMandu](https://goldmandu.chandanshakya.com.np) — daily gold and silver prices in Kathmandu
- [Learn Go](https://go.chandanshakya.com.np) — an interactive Go course, from zero to production, with progress tracking
- [Metalhub](https://metalhub.com.np) — rebuilt in Astro this year

## Changes to this website

This site itself got a lot of attention in November:

- A performance and SEO pass — it now scores 100 across the board on PageSpeed, mobile and desktop
- A **Live projects** section on the homepage linking straight to the projects above
- The [archive](/archive/) and the RSS feed now include photos and finds, not just posts and projects
- Commit counts on project pages update themselves daily from GitHub
- A cleaner homepage header, and content I can edit through Sveltia CMS without touching code

That is November. If you try Nepali Type or any of the other projects and something feels off, let me know through the contact form on the homepage.
