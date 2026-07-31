# SECONDTRACK public store

Публичный адаптивный каталог винтажной одежды SECONDTRACK. Проект построен на
React 19, Next App Router через vinext и подключается к существующему Supabase
только публичным anon-клиентом.

## Локальный запуск

```bash
npm install
copy .env.example .env
npm run dev
```

В `.env` нужно заполнить:

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Если переменные не заданы, интерфейс запускается с локальным демонстрационным
набором. Это позволяет проверить все маршруты и состояния без доступа к
production-данным.

## Маршруты

- `/` — главная;
- `/catalog` — каталог, поиск, фильтры и сортировка;
- `/product/:slug` — карточка товара;
- неизвестные адреса и отсутствующие slug возвращают 404.

## Данные Supabase

Основной источник — публичная view `public_store_items`. Запрашиваются только
поля, предназначенные для витрины:

`id`, `slug`, `title`, `brand`, `category`, `size`, `condition`,
`public_description`, `planned_sale_price`, `status`, `vinted_url`,
`primary_photo_id`, `created_at`.

Фотографии загружаются отдельным anon-запросом к `item_photos` только по ID уже
полученных публичных товаров. На странице товара запрашиваются фотографии
только текущего товара; для рекомендаций — не более четырёх связанных
позиций. Путь из Storage преобразуется в публичный URL bucket
`item-photos`. Главная фотография ставится первой по `primary_photo_id`,
дубли исключаются нормализацией результата.

Проект не использует `service_role`, не меняет schema, migration или RLS. Если
anon-политика запрещает чтение `item_photos`, интерфейс показывает безопасное
сообщение об ошибке и повторную попытку; политику нужно проверять отдельно в
Supabase.

## Проверки

```bash
npm run build
npm run lint
npm test
git diff --check
```
