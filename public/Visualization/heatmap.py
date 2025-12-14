import os
import sys
from typing import Dict, List

import pandas as pd
import plotly.graph_objects as go

# Allow running this script directly by adding the project root to sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(_file_))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

from notebooks.haseeb.group2_crime_inequality.code.basic_trends_correlations import (  # type: ignore  # noqa: E501
    load_and_merge_data,
)


def ensure_output_dir(base_path: str = ".") -> str:
    """Ensure the shared images output directory exists and return its path.

    This mirrors the helper used in the static Matplotlib/Seaborn charts so that
    all outputs land under group2_crime_inequality/images.
    """

    images_dir = os.path.join(base_path, "group2_crime_inequality", "images")
    os.makedirs(images_dir, exist_ok=True)
    return images_dir


def subdir(images_dir: str, name: str) -> str:
    """Create and return a named subdirectory under the main images dir."""

    path = os.path.join(images_dir, name)
    os.makedirs(path, exist_ok=True)
    return path


def add_tertiles(df: pd.DataFrame) -> pd.DataFrame:
    """Add inequality and urbanization tertile labels used for heatmaps.

    This follows the static heatmap logic so that comparisons between the
    Matplotlib version and the Plotly version are apples-to-apples.
    """

    out = df.copy()
    out = out.dropna(subset=["gini_coef", "urban_pop_perc"])

    out["gini_tertile"] = pd.qcut(
        out["gini_coef"], 3, labels=["Low inequality", "Mid inequality", "High inequality"]
    )
    out["urban_tertile"] = pd.qcut(
        out["urban_pop_perc"], 3, labels=["Low urban", "Mid urban", "High urban"]
    )

    return out


def build_indicator_pivots(
    df: pd.DataFrame, indicator_map: Dict[str, str]
) -> Dict[str, pd.DataFrame]:
    """Return a pivoted 3x3 table for each crime/safety indicator.

    Rows: Gini tertiles (inequality level)
    Cols: Urbanization tertiles (urbanization level)
    Values: Mean of the chosen indicator.
    """

    df_tertiles = add_tertiles(df)

    row_order: List[str] = ["Low inequality", "Mid inequality", "High inequality"]
    col_order: List[str] = ["Low urban", "Mid urban", "High urban"]

    pivots: Dict[str, pd.DataFrame] = {}
    for label, col in indicator_map.items():
        if col not in df_tertiles.columns:
            continue
        pivot = (
            df_tertiles.groupby(["gini_tertile", "urban_tertile"])[col]
            .mean()
            .unstack()
        )
        pivot = pivot.reindex(index=row_order, columns=col_order)
        pivots[label] = pivot

    return pivots


def make_interactive_heatmap(
    df: pd.DataFrame,
    images_dir: str,
    fname: str = "interactive_crime_heatmap.html",
) -> str:
    """Create an interactive Plotly heatmap for multiple crime indicators.

    The heatmap shows inequality tertiles on the y-axis, urbanization tertiles
    on the x-axis, and lets the user switch the value layer between a set of
    crime/safety indicators (violent crime, homicide, perceptions of
    criminality, violent demonstrations, access to small arms, GPI safety).
    """

    # Mapping of human-readable labels to DataFrame column names
    indicator_map: Dict[str, str] = {
        "Violent crime score": "violent_crime",
        "Homicide rate": "homicide_rate",
        "Perceptions of criminality": "perceptions_crime",
        "Violent demonstrations": "violent_demonstrations",
        "Access to small arms": "access_small_arms",
        "GPI safety & security (higher = less safe)": "gpi_safety",
    }

    pivots = build_indicator_pivots(df, indicator_map)
    if not pivots:
        raise ValueError("No valid pivots could be constructed from the dataframe.")

    labels = list(pivots.keys())
    row_order = list(next(iter(pivots.values())).index)
    col_order = list(next(iter(pivots.values())).columns)

    # Create one heatmap trace per indicator, only the first is visible by default
    traces = []
    for i, label in enumerate(labels):
        pivot = pivots[label]
        traces.append(
            go.Heatmap(
                x=col_order,
                y=row_order,
                z=pivot.values,
                colorscale="Reds",
                colorbar=dict(title="Mean value"),
                visible=(i == 0),
                hovertemplate=(
                    "Inequality level: %{y}<br>"
                    "Urbanization level: %{x}<br>"
                    + label
                    + ": %{z:.2f}<extra></extra>"
                ),
                name=label,
            )
        )

    fig = go.Figure(data=traces)

    # Build a dropdown to toggle which crime indicator is shown
    buttons = []
    for i, label in enumerate(labels):
        visibility = [False] * len(labels)
        visibility[i] = True
        buttons.append(
            dict(
                label=label,
                method="update",
                args=[
                    {"visible": visibility},
                    {
                        "title": f"{label} by inequalityurbanization buckets",
                        "coloraxis": {"colorbar": {"title": label}},
                    },
                ],
            )
        )

    fig.update_layout(
        title=f"{labels[0]} by inequalityurbanization buckets",
        xaxis_title="Urbanization level",
        yaxis_title="Inequality level",
        yaxis=dict(autorange="reversed"),  # Keep low inequality at the top
        updatemenus=[
            dict(
                type="dropdown",
                direction="down",
                x=1.05,
                y=1,
                showactive=True,
                buttons=buttons,
            )
        ],
        margin=dict(l=80, r=120, t=80, b=60),
    )

    inter_dir = subdir(images_dir, "interactions")
    out_path = os.path.join(inter_dir, fname)
    fig.write_html(out_path, include_plotlyjs="cdn", full_html=True)

    return out_path


def main() -> None:
    base_path = "."
    images_dir = ensure_output_dir(base_path)

    df = load_and_merge_data(base_path)
    print(f"Merged rows (all): {len(df)}")

    out_path = make_interactive_heatmap(df, images_dir)
    print(f"Interactive crime heatmap saved to: {out_path}")


if _name_ == "_main_":
    main()