# Recipe & Order Calculation Reference

## Calculation Rules Table

| קטגוריה | שיטה | פרמטר |
|---|---|---|
| סלטים | גרם לאדם | 35 ג' |
| תוספות | גרם לאדם | 100 ג' |
| לחמניות | יחידה + אחוז | +30% |
| ראשונות | לפי תפריט | כמות מפורשת |
| עיקריות | לפי תפריט | כמות מפורשת |
| מנות אחרונות | לפי תפריט | כמות מפורשת |
| מזנון סיום | לפי תפריט | כמות מפורשת |
| מזנון פתיחה | לפי תפריט | כמות מפורשת |

## Recipe DB Schema

```
שם מנה         | קטגוריה  | רכיב              | כמות למנה | יחידה | הערות
מטבוחה פיקנטית | סלטים    | עגבניות           | 25        | ג     |
מטבוחה פיקנטית | סלטים    | פלפל אדום         | 5         | ג     |
תפו"א צלויים   | תוספות   | תפו"א             | 85        | ג     | לפני קילוף
עוף בתנור      | עיקריות  | עוף (ירכיים)      | 250       | ג     | גולמי עם עצם
```

## Supplier Order Calculation

```python
CALC_RULES = {
    'סלטים':   {'method': 'per_guest_grams', 'grams': 35},
    'תוספות':  {'method': 'per_guest_grams', 'grams': 100},
    'לחמניות': {'method': 'per_guest_plus_pct', 'pct': 30},
    # all others: use qty as-is from menu
}

def calc_portions(category, menu_qty, guests):
    rule = CALC_RULES.get(category, {'method': 'as_ordered'})
    if rule['method'] == 'per_guest_grams':
        # total grams = guests * grams_per_person
        # then multiply recipe ingredients by (total_grams / grams_per_portion)
        return guests  # effective_portions = guests, ingredient scale = grams_per_person / recipe_portion_size
    elif rule['method'] == 'per_guest_plus_pct':
        return round(guests * (1 + rule['pct']/100))
    else:
        return menu_qty  # as ordered in menu

def get_ingredient_total(dish_name, recipe_db, effective_portions, recipe_portion_grams):
    """
    For per-gram categories: scale = (effective_portions * grams_per_person) / recipe_portion_grams
    For per-portion categories: scale = effective_portions
    """
    ingredients = recipe_db[dish_name]
    totals = {}
    for ingr_name, ingr_qty_per_portion, unit in ingredients:
        total = ingr_qty_per_portion * effective_portions
        totals[ingr_name] = (total, unit)
    return totals
```

## Supplier Sheet Output Format

Group by material category (not dish category):

| חומר גלם | סה"כ כמות | יחידה | פירוט לפי מנה |
|---|---|---|---|
| עגבניות | 45 | ק"ג | מטבוחה (20ק"ג) + שקשוקה (25ק"ג) |
| חזה עוף | 120 | ק"ג | שניצל (80ק"ג) + סטייק (40ק"ג) |

Convert grams to kg when total > 1000g. Round to nearest 0.5kg.

## Kitchen Prep Sheet Output Format

One section per dish:

```
עוף בתנור | 300 מנות
  עוף ירכיים: 75 ק"ג
  שמן זית: 3 ק"ג
  שום: 1.5 ק"ג
  תבלינים: 1.5 ק"ג
```
