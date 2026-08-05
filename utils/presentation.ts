const CATEGORY_LABELS: Record<string, string> = {
  Аксессуары: "Accessories",
  Брюки: "Trousers",
  Другое: "Other",
  Куртка: "Jacket",
  Обувь: "Shoes",
  Рубашка: "Shirt",
  Свитер: "Knitwear",
  Толстовка: "Sweatshirt",
  Футболка: "T-shirt",
  Худи: "Hoodie",
  Шорты: "Shorts",
};

const CONDITION_LABELS: Record<string, string> = {
  Новое: "New",
  "Очень хорошее": "Very good",
  Удовлетворительное: "Fair",
  Хорошее: "Good",
};

export const presentCategory = (value: string) => CATEGORY_LABELS[value] ?? value;
export const presentCondition = (value: string) => CONDITION_LABELS[value] ?? value;
