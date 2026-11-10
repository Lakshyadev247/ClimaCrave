# ClimaCrave ML recommendation model

ClimaCrave includes a small, local logistic-regression model for food/weather suitability.

- The model uses structured food features already present in `js/script.js` plus weather inputs.
- It was trained on 6,660 labeled food/weather scenarios derived from the existing ClimaCrave food-compatibility rules, with a small amount of label noise to make the training examples less deterministic.
- Validation accuracy on the held-out test set: about 76.4%.
- Runtime inference is pure JavaScript using `model.json`; no Python, LLM, GPU, or paid ML API is needed.
- Settings provides three modes: Food Rules, ML Model, and Hybrid (65% rules + 35% ML).

The existing `FOOD_DB` and its embedded Base64 images are left untouched.
