import { RotateCcw } from "lucide-react";
import Link from "next/link";

export function LoadingState({ count = 4 }: { count?: number }) {
  return (
    <div aria-label="Загрузка товаров" aria-live="polite" className="skeleton-grid">
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-card" key={index}>
          <div className="skeleton skeleton--image" />
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line skeleton--short" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({
  description = "Попробуйте ещё раз. Ваши фильтры и избранное останутся на месте.",
  retry,
  title = "Не получилось загрузить каталог",
}: {
  description?: string;
  retry: () => void;
  title?: string;
}) {
  return (
    <section className="state-panel" role="alert">
      <p className="eyebrow">Связь прервалась</p>
      <h2>{title}</h2>
      <p>{description}</p>
      <button className="button button--outline" onClick={retry} type="button">
        <RotateCcw aria-hidden="true" />
        Повторить
      </button>
    </section>
  );
}

export function EmptyState({
  filtered = false,
  onReset,
}: {
  filtered?: boolean;
  onReset?: () => void;
}) {
  return (
    <section className="state-panel">
      <p className="eyebrow">{filtered ? "Ничего не найдено" : "Пока тихо"}</p>
      <h2>
        {filtered
          ? "Попробуйте изменить параметры"
          : "Новые вещи скоро появятся"}
      </h2>
      <p>
        {filtered
          ? "Сбросьте один или несколько фильтров, чтобы увидеть больше вещей."
          : "Мы публикуем только отобранные позиции, поэтому каталог обновляется небольшими коллекциями."}
      </p>
      {filtered && onReset ? (
        <button className="text-link text-link--button" onClick={onReset} type="button">
          Очистить фильтры
        </button>
      ) : (
        <Link className="text-link" href={filtered ? "/catalog" : "/"}>
          {filtered ? "Очистить фильтры" : "Вернуться на главную"}
        </Link>
      )}
    </section>
  );
}
