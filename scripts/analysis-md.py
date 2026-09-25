# Собирает competitors/ANALYSIS.md из competitors/analysis.json.
import json
d = json.load(open('competitors/analysis.json'))
L = ['# Анализ главных страниц 14 конкурентов', '',
     f"Снято {d['date']} скриптом `scripts/competitor-audit.mjs`, сырые данные и скриншоты — в `competitors/audit/`. Цифры и формулировки — как на самих сайтах.", '',
     'Семейства похожих сайтов: **A** — сеть GMR (01, 02, 08: одинаковый контент), **B** — один шаблон 1С-Битрикс (04, 06), **C** — одна студия (05, 07, 11).', '']
L += ['## Сводная таблица', '', '| Сайт | Первый экран | Формы и лид-магниты | Доверие | Контакты |', '|---|---|---|---|---|']
for s in d['sites']:
    L.append(f"| **{s['id']} · {s['name']}**<br>[{s['url'].replace('https://', '').rstrip('/')}]({s['url']})<br>{s['cms']} | {s['hero']} | {s['leads']} | {s['trust']} | {s['contacts']} |")
L += ['']
for s in d['sites']:
    fam = f", семейство {s['family']}" if s['family'] != '—' else ''
    L += [f"## {s['id']} · {s['name']} — [{s['url'].replace('https://', '').rstrip('/')}]({s['url']})", '',
          f"{s['cms']}, высота главной ≈ {s['height']:,} px{fam}".replace(',', ' '), '', '**Структура главной сверху вниз:**', '']
    L += [f"{i + 1}. {x}" for i, x in enumerate(s['structure'])]
    for t, k in [('Что хорошо для продаж', 'good'), ('Слабые места', 'bad'), ('Что можно взять', 'take')]:
        if s[k]:
            L += ['', f'**{t}:**', ''] + ['- ' + x for x in s[k]]
    L += ['']
ids = [s['id'] for s in d['sites']]
L += ['## Матрица: какие блоки есть на главной', '', '| Блок | ' + ' | '.join(ids) + ' | Всего |', '|---|' + '---|' * len(ids) + '---|']
for name, m in d['blocks']:
    L.append(f"| {name} | " + ' | '.join('●' if i in m else '' for i in ids) + f" | {len(m)} |")
S = d['summary']
L += ['', '## Общий вывод', '', '### База рынка — должно быть у нас тоже', ''] + ['- ' + x for x in S['base']]
L += ['', '### Идеи, которые можно взять', '', '| № | Идея | Источник |', '|---|---|---|'] + [f"| {a} | {b} | {c} |" for a, b, c in S['ideas']]
L += ['', '### Чего избегать', ''] + ['- ' + x for x in S['avoid']]
open('competitors/ANALYSIS.md', 'w').write('\n'.join(L) + '\n')
