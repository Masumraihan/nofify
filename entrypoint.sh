#!/bin/sh
npm run build
npx prisma generate
npx prisma db push
npm run dev
