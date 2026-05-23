-- supabase/seeds/demo_users.sql
--
-- One-time demo data so the site doesn't look empty during development.
-- Creates 5 fake users with 2 stories each (10 total) across all 7
-- categories, in both English and Russian. Adds view counts and a few
-- cross-user reactions so feed cards look populated.
--
-- HOW TO RUN
--   1. Open Supabase Dashboard → SQL Editor → New query
--   2. Paste this whole file
--   3. Click Run
--
-- AFTER RUNNING
--   - 5 new users in Authentication → Users (emails: demo1..5@nurlan.local)
--   - Password for all five demo users: demo123456
--   - Sign in as any of them at /login with the email + password above
--
-- TO CLEAN UP (re-run from scratch)
--   Uncomment the DELETE block below, run it, then re-run the whole file.

-- ---------- cleanup (commented out by default) ----------
-- delete from auth.users where email like 'demo%@nurlan.local';
--   Cascades to profiles, stories, reactions, story_views via FKs.

-- ---------- main seed ----------
do $$
declare
  uid_alex   uuid := gen_random_uuid();
  uid_sarah  uuid := gen_random_uuid();
  uid_misha  uuid := gen_random_uuid();
  uid_jamie  uuid := gen_random_uuid();
  uid_kira   uuid := gen_random_uuid();
begin

  -- ───── 1. Five demo users ────────────────────────────────────────────
  -- Insert directly into auth.users. The handle_new_user trigger fires
  -- and creates matching profile rows (username pulled from
  -- raw_user_meta_data->>'username'). Passwords hashed via pgcrypto's
  -- crypt() with bcrypt salt (gen_salt('bf')) — matches Supabase Auth's
  -- expected encryption.
  insert into auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data,
    is_super_admin, is_sso_user, is_anonymous
  ) values
    (uid_alex,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'demo1@nurlan.local', crypt('demo123456', gen_salt('bf')), now(),
     now() - interval '14 days', now() - interval '14 days',
     jsonb_build_object('username', 'alex_morgan',  'display_name', 'Alex Morgan'),
     '{}'::jsonb, false, false, false),
    (uid_sarah, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'demo2@nurlan.local', crypt('demo123456', gen_salt('bf')), now(),
     now() - interval '12 days', now() - interval '12 days',
     jsonb_build_object('username', 'sarah_chen',   'display_name', 'Sarah Chen'),
     '{}'::jsonb, false, false, false),
    (uid_misha, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'demo3@nurlan.local', crypt('demo123456', gen_salt('bf')), now(),
     now() - interval '11 days', now() - interval '11 days',
     jsonb_build_object('username', 'misha_petrov', 'display_name', 'Миша Петров'),
     '{}'::jsonb, false, false, false),
    (uid_jamie, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'demo4@nurlan.local', crypt('demo123456', gen_salt('bf')), now(),
     now() - interval '8 days', now() - interval '8 days',
     jsonb_build_object('username', 'jamie_walsh',  'display_name', 'Jamie Walsh'),
     '{}'::jsonb, false, false, false),
    (uid_kira,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'demo5@nurlan.local', crypt('demo123456', gen_salt('bf')), now(),
     now() - interval '5 days', now() - interval '5 days',
     jsonb_build_object('username', 'kira_ivanova', 'display_name', 'Кира Иванова'),
     '{}'::jsonb, false, false, false);

  -- Light bio for each so profile pages aren't empty.
  update profiles set bio = 'Brooklyn copywriter. I write the things I''m too tired to say out loud.' where id = uid_alex;
  update profiles set bio = 'Former biology grad turned product designer. I overshare for fun.'        where id = uid_sarah;
  update profiles set bio = 'Журналист. Пишу о людях, которых обычно никто не слушает.'                where id = uid_misha;
  update profiles set bio = 'Hiker, oversharer, terrible cook. From Maine.'                             where id = uid_jamie;
  update profiles set bio = 'Москва → Берлин. Иногда пишу, чаще читаю.'                                 where id = uid_kira;

  -- ───── 2. Ten stories ────────────────────────────────────────────────
  insert into stories (author_id, title, body, category_slug, language, tags, created_at) values

  -- Alex Morgan: Life + Work (EN)
  (uid_alex,
   'The receipt that ended my engagement',
   E'I came home Tuesday and saw a CVS bag on the counter. He''d been at work. I checked the receipt — Plan B, $52, purchased 4pm. I was at home all day. I''m not on Plan B. I''m the only woman who could have asked him to buy it. Except I didn''t.\n\nHe doesn''t have a sister. He has one female friend, and she''s gay and partnered.\n\nI sat with the receipt for forty minutes. When he walked in I held it up and said one word — "explain". The story he gave me was so well-rehearsed I knew he''d been telling himself it for weeks. The girl was nineteen. He''d met her at a conference in Denver six months ago, they "weren''t really together," and he''d "just been helping her out." He used the word "favor" three times.\n\nI packed a bag that night. The ring went into the freezer for some reason — I think I was watching myself do it. Three days later I closed our joint account and changed my phone number. He''s still trying to reach me through his sister.\n\nDon''t marry someone you haven''t fought with.',
   'life', 'en', array['breakup', 'lessons', 'true story'],
   now() - interval '6 hours'),

  (uid_alex,
   'My boss DMed me at 2 AM and changed my career',
   E'I''d been at the agency for two years, eating turn-down-the-volume comments on every project I led. On August 14th at 2:07 AM my phone lit up with a Slack DM from our director: "You need to see this."\n\nAttached was a deck — 47 slides — of a competing agency''s pitch for a client we''d lost three months earlier. I''d built the rejected version. Every slide they''d used was a worse version of something I''d shown internally. Same diagrams. Same color palette. Same closing line.\n\nMy director just wrote: "We''re not losing the next one."\n\nI didn''t sleep. The next morning he sat me down and put me on the rebuilt pitch for that same client. We won it back in October. I''m a creative director now. I think about that 2am message every time I''m tempted to soft-pedal an idea in a meeting.',
   'work', 'en', array['career', 'agency life'],
   now() - interval '2 days'),

  -- Sarah Chen: Relationships + Cringe (EN)
  (uid_sarah,
   'I met my husband at his own funeral',
   E'It wasn''t actually his funeral. It was his twin brother''s. We didn''t know each other yet.\n\nI''d dated the brother for three months in college and we''d stayed in touch sporadically — Christmas cards, the occasional birthday text. When he died in a climbing accident at 27, his family invited me to the service. I drove eight hours.\n\nI walked into the receiving line and saw, at the end of it, what I thought was a ghost. Same face. Same nervous half-smile. He saw me look and his face fell into the same recognition. We shook hands. He said, "Mark talked about you."\n\nThat was nine years ago. We were married three years later.\n\nPeople assume it''s macabre and maybe it is. But what nobody tells you about grief is that you find the people who knew the version of you that died too. He knew the twenty-two year old me through his brother''s stories. I knew his brother through him. Our wedding photos have an empty chair in the front row. Nobody comments on it. They know.',
   'relationships', 'en', array['grief', 'love', 'long read'],
   now() - interval '18 hours'),

  (uid_sarah,
   'Sent the wrong text to my mother in law',
   E'It was a Tuesday in February. I was 31 weeks pregnant and exhausted. My husband and I had been bickering all weekend about his mother''s plan to "stay for a month" after the baby arrived. We agreed she''d be told two weeks, max. He hadn''t told her yet.\n\nI was venting to my best friend Priya by text — long, ranty messages about how I''d murder this woman if she so much as touched a baby bottle in my house. I sent: "She is going to RUIN this for me Priya I can already see it. Two weeks and out or I''m filing for divorce I swear."\n\nI hit send. The receipt: "Delivered" — to my mother-in-law. Not Priya.\n\nI died a small death sitting on my couch. Three minutes of staring at the screen. Then the typing indicator appeared. It stayed there for what felt like a year.\n\nThe reply: "I''ll come for one week. I love you. Get some rest."\n\nI cried. She came for one week. She did not touch a single bottle. We text every Sunday now. Sometimes the universe just hands you the daughter-in-law-mother-in-law relationship of a Hallmark movie because you sent the wrong text on a Tuesday.',
   'cringe', 'en', array['pregnancy', 'in-laws', 'oops'],
   now() - interval '3 days'),

  -- Misha Petrov: School + Weird (RU)
  (uid_misha,
   E'Учительница, которая дала мне переписать всё',
   E'В девятом классе я завалил годовое сочинение по литературе. Не просто двойка — буквально 1/10, "ниже минимального уровня грамотности". Учительница, Нина Сергеевна, вызвала меня после уроков.\n\nЯ думал, будет проработка, родителей вызовут, как обычно. Она положила сочинение передо мной, открыла на первой странице, и сказала: "Перепиши его. Не для оценки. Для себя. Возьми любую тему, любое произведение. Принеси через неделю."\n\nЯ три раза переписывал, не показывая. Каждый раз она просто говорила "ещё раз" и возвращала. На четвёртый раз — это был июнь, школа уже закрывалась — она прочитала, сложила страницы, и сказала: "Вот, теперь ты можешь писать". Поставила в журнал тройку за год.\n\nЯ её ненавидел. Я думал, она просто не хочет ставить мне двойку и портить статистику.\n\nЧерез девять лет я закончил факультет журналистики. Через пятнадцать — выпустил первую книгу. Послал ей экземпляр на адрес школы. Через месяц пришло письмо обратно — она ушла на пенсию, но кто-то переслал. "Я ещё в девятом классе понимала, что ты можешь. Я просто ждала, когда ты сам поймёшь."\n\nОна умерла в прошлом году. Мне до сих пор хочется ей перезвонить.',
   'school', 'ru', array['учителя', 'школа', 'благодарность'],
   now() - interval '1 day'),

  (uid_misha,
   E'Соседка снизу пять лет приносила мне почту, которой не было',
   E'Я переехал в эту квартиру в 2019-м. Через месяц соседка снизу, бабушка лет восьмидесяти, постучалась с конвертом. "Тебе пришло." На конверте — мой адрес, моё имя. Внутри — поздравительная открытка на день рождения от какого-то "Андрея П." Я не знаю никакого Андрея.\n\nЧерез пару недель — ещё одна. Потом ещё. Все на моё имя, все от разных людей, никого из которых я не знаю. Я не подавался ни в какие подписки, не оставлял адрес. Спрашиваю на почте — нет таких отправлений в базе.\n\nЯ начал хранить их в коробке. За пять лет — двадцать семь конвертов.\n\nВ прошлом месяце соседка умерла. Я спустился на прощание и среди вещей в её квартире увидел письменный стол. На нём — стопка одинаковых конвертов, моих чернил, мой шрифт. И список имён в тетради: "Андрей П., Михаил К., Татьяна О." — двадцать семь имён. Все вычеркнутые.\n\nЯ не знаю, зачем она их писала. Я не могу её спросить. Я храню коробку.',
   'weird', 'ru', array['соседи', 'странное', 'почта'],
   now() - interval '4 days'),

  -- Jamie Walsh: Horror + Life (EN)
  (uid_jamie,
   'My neighbor''s window has been open for three years',
   E'I moved into my apartment in October 2021. My bedroom window faces the back of the building across the alley. Third floor, second window from the left.\n\nIt''s been open — fully open, sash pushed all the way up — every single day since I moved in. Through winter. Through hurricanes. Through the heat wave last August where the news told everyone to seal their windows.\n\nI started taking photos. I have a folder. The curtain inside is always the same: a heavy gray one, never moves. I''ve never seen a light on in there. I''ve never seen a person. The window has a small plant on the sill that has not visibly grown or died.\n\nI went and asked the building''s super last May. He looked at me like I''d asked him about a ghost. He said the apartment has been "between tenants for a while." I asked how long. He said "since before my time."\n\nHe''s worked there for nine years.',
   'horror', 'en', array['neighbors', 'unexplained'],
   now() - interval '9 hours'),

  (uid_jamie,
   'I found a stranger''s journal on a beach in Maine',
   E'Last September I was on vacation in a town called Lubec — far northeast Maine, basically Canada. Walking on the rocks at low tide I picked up what I thought was a piece of driftwood. It was a small leather-bound notebook, completely soaked.\n\nI took it back to the rental and laid it out on a towel. It was a journal. Forty-three pages. Dated entries from 2011 to 2014. A woman, I think — handwriting was looped and careful — writing about her son''s first year of high school, her mother''s diagnosis, a job she was about to leave. The last entry was four lines and ended mid-sentence.\n\nNo name anywhere in the book. No address.\n\nI drove around for two days. I asked at the gas station, the diner, the post office. Nobody recognized the handwriting. Before I drove home I left it in a clear ziploc bag on the windowsill of the town library, with a note: "Found on the beach. If this is yours, it''s yours."\n\nI drove back through Lubec this June. The bag was gone.',
   'life', 'en', array['travel', 'maine', 'small towns'],
   now() - interval '5 days'),

  -- Kira Ivanova: Relationships + Cringe (RU)
  (uid_kira,
   E'Первое свидание через десять лет молчания',
   E'Мы встречались в 2014-м. Шесть месяцев, страшно интенсивно, и закончилось плохо — он уехал в Прагу на работу, мы пытались делать дистанцию, я не выдержала и заблокировала его везде в одну ночь. С тех пор — десять лет. Ни одного сообщения.\n\nВ этом мае я была в Берлине на конференции, шла по Хакешер Маркт, и в окне кафе увидела его. Сидел один, читал. Я прошла мимо два раза. На третий — зашла.\n\nОн не вздрогнул, как будто ждал. "Тебе как обычно?" — спросил он, и я не помнила, что у меня было "как обычно" десять лет назад, но кивнула.\n\nМы просидели четыре часа. Не говорили о расставании, не говорили о том, кто что почувствовал. Говорили про родителей, про музыку, про то, как мы оба теперь не пьём кофе после двух.\n\nПеред тем как уйти он спросил: "А ты помнишь свой пароль от старой почты?" Я помнила. Он улыбнулся и сказал: "Я писал тебе туда восемь лет. Раз в месяц. Просто проверь, если захочешь."\n\nЯ ещё не открыла. Я думаю, открою.',
   'relationships', 'ru', array['любовь', 'возвращение', 'берлин'],
   now() - interval '14 hours'),

  (uid_kira,
   E'Полчаса танцевала с директором, думая что это его сын',
   E'Корпоратив, декабрь, новый офис в Москве. Я работаю в компании три месяца. Знаю в лицо штук восемь человек. Полусветлый зал, музыка, я уже выпила два бокала.\n\nК столу подходит мужчина лет 25, симпатичный, в свитере. Говорит: "Ты новенькая? Я тоже." Я думаю — наверное, чей-то родственник, сын кого-то с верхнего этажа.\n\nПолчаса мы танцуем, я ему рассказываю про начальство, про то, кто чем дышит, какие сплетни ходят. Особенно про директора по продажам — что он "противный, всегда смотрит свысока, мы его все боимся". Парень улыбается, кивает. На словах "противный" я добавила, что у него ещё и галстук дурацкий каждый день.\n\nНа следующий день в понедельник прихожу в офис. На совещании на 9 утра во главе стола сидит вчерашний "симпатичный парень в свитере". В костюме. В дурацком галстуке.\n\nЭто был не сын. Это был сам директор по продажам, который перешёл из московского офиса в наш две недели назад.\n\nЯ не уволилась. Он сделал вид, что ничего не было. Через год повысил меня. Я думаю, ему нужны были честные отзывы.',
   'cringe', 'ru', array['работа', 'корпоратив', 'опозорилась'],
   now() - interval '6 days');

  -- ───── 3. View counts ────────────────────────────────────────────────
  -- Direct UPDATE bypasses the bump_story_view_count trigger and gets us
  -- realistic numbers in one shot. Allowed because we're running as the
  -- postgres role (no JWT context), so protect_restricted_columns lets
  -- us through.
  update stories set view_count = floor(random() * 250 + 80)::int
   where author_id in (uid_alex, uid_sarah, uid_misha, uid_jamie, uid_kira);

  -- ───── 4. Cross-user reactions ───────────────────────────────────────
  -- Each user reacts to a couple of stories from other users with a
  -- random reaction type. Makes the reaction count + breakdown on feed
  -- cards look populated.
  insert into reactions (story_id, user_id, type)
  select s.id, u.id,
         (array['funny','insane','sad','cringe','mindblown','viral'])
           [1 + floor(random() * 6)::int]::reaction_type
  from stories s
  cross join (
    select id from auth.users
    where email like 'demo%@nurlan.local'
  ) u
  where s.author_id != u.id
    and random() < 0.6  -- roughly 60% of cross-author pairs react
  on conflict (story_id, user_id, type) do nothing;

  -- ───── 5. A few comments to fill story pages ─────────────────────────
  insert into comments (story_id, author_id, body, created_at)
  select s.id, u.id, c.body, now() - (random() * interval '3 days')
  from stories s
  cross join lateral (
    select id from auth.users
    where email like 'demo%@nurlan.local' and id != s.author_id
    order by random()
    limit 1
  ) u
  cross join lateral (values
    ('this hit harder than I expected'),
    ('I have a version of this story. Mine ended worse.'),
    ('Saved. Coming back to this tonight.'),
    ('Whew. I needed to read this.'),
    (E'Чёрт. Это слишком знакомо.'),
    (E'Спасибо что написал. Не один такой.')
  ) c(body)
  where random() < 0.5; -- ~half of stories get one comment

  raise notice 'Seeded 5 users + 10 stories + reactions + comments. Login: demo1..5@nurlan.local / demo123456';
end $$;
