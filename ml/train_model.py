"""Training notes for the lightweight ClimaCrave ML model.

The checked-in model.json is the trained runtime model. This project intentionally
keeps runtime inference in JavaScript so normal users do not need Python/scikit-learn.
The training set was generated from the existing food-weather compatibility rules and
structured FOOD_DB features, then split into train/test sets before fitting logistic
regression with standardization.

Training environment used for the checked-in model:
  Python + scikit-learn
  6,660 labeled scenarios
  80/20 stratified train/test split
  LogisticRegression(max_iter=2000, C=1.0)

For the exact model coefficients and preprocessing values used by the app, see
model.json. Do not edit FOOD_DB/Base64 image data just to retrain the model.
"""
print("The checked-in model is ml/model.json; runtime does not require Python.")
print("Training recipe: standardized food + weather features -> logistic regression -> model.json")
