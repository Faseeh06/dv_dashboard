import pandas as pd
import os

# -------------------- CONFIG: update these paths --------------------
main_file = r"D:\Study Stuff\Semester\Projects\5th Semester\DV\UI\public\Data\main.csv"
gdp_file = r"D:\Study Stuff\Semester\Projects\5th Semester\DV\UI\public\Data\gdp.csv"
output_file = r"D:\Study Stuff\Semester\Projects\5th Semester\DV\UI\public\Data\final_with_gdp.csv"
# --------------------------------------------------------------------

# ---- READ FILES ----
main_df = pd.read_csv(main_file)
gdp_df = pd.read_csv(gdp_file, usecols=["country_code", "gdp", "year"])  # only required columns

# ---- RENAME GDP COLUMNS TO MATCH MAIN ----
gdp_df = gdp_df.rename(columns={
    "country_code": "Country_Code",
    "year": "Year"
})

# ---- NORMALIZE: remove extra spaces and ensure uppercase for codes ----
main_df["Country_Code"] = main_df["Country_Code"].astype(str).str.strip().str.upper()
gdp_df["Country_Code"] = gdp_df["Country_Code"].astype(str).str.strip().str.upper()

# ---- ENSURE YEAR IS INTEGER ----
main_df["Year"] = main_df["Year"].astype(int)
gdp_df["Year"] = gdp_df["Year"].astype(int)

# ---- MERGE ----
final_df = main_df.merge(
    gdp_df,
    on=["Country_Code", "Year"],
    how="left"
)

# ---- SAVE FINAL CSV ----
final_df.to_csv(output_file, index=False)

print("✓ Merge complete. Final file saved as:", output_file)
