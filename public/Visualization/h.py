"""
Create professional area chart showing renewable energy consumption percentage trends over years
Similar style to GDP trajectory chart
"""

import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from pathlib import Path

# Set style to match reference image
plt.style.use('default')
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['Arial', 'DejaVu Sans', 'Liberation Sans']
plt.rcParams['figure.facecolor'] = 'white'
plt.rcParams['axes.facecolor'] = 'white'

# Load data
data_path = Path("data_cleaned/global_urbanization_2008_2020.csv")
df = pd.read_csv(data_path)

print("Creating Renewable Energy Consumption Area Chart...")
print(f"Data shape: {df.shape}")
print(f"Countries: {df['country'].nunique()}")
print(f"Years: {df['year'].min()} - {df['year'].max()}")

# Calculate global aggregates for renewable energy
# Weighted average by population to get accurate global picture
df['renewable_weighted'] = df['renewable_energy_consumption_percent'] * df['total_population']
renewable_data = df.groupby('year').agg({
    'renewable_weighted': 'sum',
    'total_population': 'sum',
    'renewable_energy_consumption_percent': 'mean'  # Simple average for comparison
}).reset_index()

# Calculate weighted average renewable energy percentage
renewable_data['renewable_energy_percent_weighted'] = (
    renewable_data['renewable_weighted'] / renewable_data['total_population']
)

# Also calculate simple average for comparison
renewable_data['renewable_energy_percent_mean'] = df.groupby('year')['renewable_energy_consumption_percent'].mean().values

# Use weighted average (more accurate for global trends)
renewable_data['renewable_energy_percent'] = renewable_data['renewable_energy_percent_weighted']

# ============================================================================
# Chart 1: Global Renewable Energy Consumption Trajectory (2008-2020) - Main Area Chart
# ============================================================================
fig1, ax1 = plt.subplots(figsize=(14, 8))

# Calculate y-axis range to emphasize the trend
y_max = renewable_data['renewable_energy_percent'].max()
y_min = renewable_data['renewable_energy_percent'].min()
y_range = y_max - y_min

# Use a focused y-axis range to better show the trend (not starting at 0)
# Start slightly below minimum and extend above maximum
y_bottom = max(0, y_min - y_range * 0.3)  # Start below min but not negative
y_top = y_max + y_range * 0.3  # Extend above max

# Create area chart
ax1.fill_between(
    renewable_data['year'], 
    y_bottom,  # Start from bottom of focused range
    renewable_data['renewable_energy_percent'],
    color='#4A90E2',  # Blue fill
    alpha=0.4,
    linewidth=0
)

# Add main line
ax1.plot(
    renewable_data['year'],
    renewable_data['renewable_energy_percent'],
    color='#1E3A8A',  # Dark blue line
    linewidth=2.5,
    marker='o',
    markersize=6,
    markerfacecolor='#1E3A8A',
    markeredgecolor='white',
    markeredgewidth=1
)

# Formatting
ax1.set_xlabel('Year', fontsize=14, fontweight='bold', labelpad=10)
ax1.set_ylabel('Renewable Energy Consumption (%)', fontsize=14, fontweight='bold', labelpad=10)
ax1.set_title('Global Renewable Energy Consumption Trajectory (2008-2020)\nPercentage of Total Energy Consumption', 
              fontsize=16, fontweight='bold', pad=20)

# Set x-axis ticks (every 2 years like reference)
ax1.set_xticks(range(2008, 2021, 2))
ax1.set_xticks(range(2008, 2021), minor=True)

# Set focused y-axis range to emphasize trend
ax1.set_ylim(y_bottom, y_top)

# Format y-axis with appropriate intervals for the focused range
# Use smaller intervals to show the trend better
tick_range = y_top - y_bottom
if tick_range < 5:
    major_ticks = np.arange(y_bottom, y_top + 0.5, 0.5)
    minor_ticks = np.arange(y_bottom, y_top + 0.5, 0.1)
elif tick_range < 10:
    major_ticks = np.arange(y_bottom, y_top + 1, 1)
    minor_ticks = np.arange(y_bottom, y_top + 1, 0.2)
else:
    major_ticks = np.arange(y_bottom, y_top + 2, 2)
    minor_ticks = np.arange(y_bottom, y_top + 2, 0.5)

ax1.set_yticks(major_ticks)
ax1.set_yticks(minor_ticks, minor=True)

# Grid
ax1.grid(True, which='major', linestyle='-', linewidth=0.8, color='#CCCCCC', alpha=0.5)
ax1.grid(True, which='minor', linestyle='--', linewidth=0.5, color='#E0E0E0', alpha=0.3)

# Remove top and right spines
ax1.spines['top'].set_visible(False)
ax1.spines['right'].set_visible(False)
ax1.spines['left'].set_color('#1E3A8A')  # Blue spine
ax1.spines['bottom'].set_color('#666666')

# Format y-axis labels
ax1.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{x:.1f}'))

# Calculate year-over-year change for annotations
renewable_data['yoy_change'] = renewable_data['renewable_energy_percent'].diff()

# Add annotation for key milestones if significant changes
if renewable_data['yoy_change'].max() > 0.3:  # Lower threshold to show growth
    max_growth_idx = renewable_data['yoy_change'].idxmax()
    max_growth_year = renewable_data.loc[max_growth_idx, 'year']
    max_growth_value = renewable_data.loc[max_growth_idx, 'renewable_energy_percent']
    ax1.annotate(f'Largest Increase\n({max_growth_year:.0f})', 
                 xy=(max_growth_year, max_growth_value),
                 xytext=(max_growth_year + 1, max_growth_value + y_range * 0.15),
                 arrowprops=dict(arrowstyle='->', color='#1E3A8A', lw=1.5),
                 fontsize=10, color='#1E3A8A', fontweight='bold',
                 bbox=dict(boxstyle='round,pad=0.5', facecolor='white', alpha=0.9, edgecolor='#1E3A8A'))

plt.tight_layout()
output_path1 = Path("renewable_energy_trajectory_area_chart.png")
plt.savefig(output_path1, dpi=300, bbox_inches='tight', facecolor='white')
print(f"Saved: {output_path1}")

# ============================================================================
# Chart 2: Renewable Energy with Urbanization Overlay (Dual-axis)
# ============================================================================
# Calculate urbanization for comparison
df['urban_pop_weighted'] = df['urban_population_percent'] * df['total_population']
urban_data = df.groupby('year').agg({
    'urban_pop_weighted': 'sum',
    'total_population': 'sum'
}).reset_index()
urban_data['urban_population_percent_weighted'] = (
    urban_data['urban_pop_weighted'] / urban_data['total_population']
)

# Merge with renewable data
comparison_data = renewable_data.merge(
    urban_data[['year', 'urban_population_percent_weighted']],
    on='year',
    how='left'
)

fig2, ax2 = plt.subplots(figsize=(14, 8))

# Create dual-axis plot
ax2_twin = ax2.twinx()

# Renewable energy area chart (left axis)
ax2.fill_between(
    comparison_data['year'],
    0,
    comparison_data['renewable_energy_percent'],
    color='#27AE60',  # Green for renewable energy
    alpha=0.3,
    linewidth=0,
    label='Renewable Energy'
)

ax2.plot(
    comparison_data['year'],
    comparison_data['renewable_energy_percent'],
    color='#1E8449',  # Darker green line
    linewidth=2.5,
    marker='o',
    markersize=6,
    markerfacecolor='#1E8449',
    markeredgecolor='white',
    markeredgewidth=1,
    label='Renewable Energy Consumption (%)'
)

# Urbanization line (right axis)
ax2_twin.plot(
    comparison_data['year'],
    comparison_data['urban_population_percent_weighted'],
    color='#E74C3C',  # Red for urbanization
    linewidth=2.5,
    marker='s',
    markersize=6,
    markerfacecolor='#E74C3C',
    markeredgecolor='white',
    markeredgewidth=1,
    label='Average Urbanization (%)'
)

# Formatting
ax2.set_xlabel('Year', fontsize=14, fontweight='bold', labelpad=10)
ax2.set_ylabel('Renewable Energy Consumption (%)', fontsize=14, fontweight='bold', 
               labelpad=10, color='#1E8449')
ax2_twin.set_ylabel('Average Urbanization (%)', fontsize=14, fontweight='bold', 
                    labelpad=10, color='#E74C3C')
ax2.set_title('Renewable Energy and Urbanization Trends (2008-2020)\nSustainable Energy Transition', 
              fontsize=16, fontweight='bold', pad=20)

# Set x-axis ticks
ax2.set_xticks(range(2008, 2021, 2))
ax2.set_xticks(range(2008, 2021), minor=True)

# Format y-axes
renewable_max = comparison_data['renewable_energy_percent'].max()
ax2.set_ylim(0, max(renewable_max + 2, 30))
ax2.set_yticks(np.arange(0, max(renewable_max + 2, 30), 2))
ax2.tick_params(axis='y', labelcolor='#1E8449')

urban_max = comparison_data['urban_population_percent_weighted'].max()
urban_min = comparison_data['urban_population_percent_weighted'].min()
ax2_twin.set_ylim(urban_min - 2, urban_max + 2)
ax2_twin.tick_params(axis='y', labelcolor='#E74C3C')

# Grid
ax2.grid(True, which='major', linestyle='-', linewidth=0.8, color='#CCCCCC', alpha=0.5)
ax2.grid(True, which='minor', linestyle='--', linewidth=0.5, color='#E0E0E0', alpha=0.3)

# Remove top spine
ax2.spines['top'].set_visible(False)
ax2.spines['left'].set_color('#1E8449')
ax2.spines['bottom'].set_color('#666666')
ax2_twin.spines['top'].set_visible(False)
ax2_twin.spines['right'].set_color('#E74C3C')

# Legend
lines1, labels1 = ax2.get_legend_handles_labels()
lines2, labels2 = ax2_twin.get_legend_handles_labels()
ax2.legend(lines1 + lines2, labels1 + labels2, loc='upper left', fontsize=11, framealpha=0.9)

plt.tight_layout()
output_path2 = Path("renewable_energy_urbanization_dual_axis.png")
plt.savefig(output_path2, dpi=300, bbox_inches='tight', facecolor='white')
print(f"Saved: {output_path2}")

# ============================================================================
# Chart 3: Year-over-Year Change in Renewable Energy
# ============================================================================
fig3, ax3 = plt.subplots(figsize=(14, 8))

# Calculate year-over-year change
renewable_data['yoy_change'] = renewable_data['renewable_energy_percent'].diff()
renewable_data['yoy_change_pct'] = (
    renewable_data['renewable_energy_percent'].pct_change() * 100
)

# Create area chart for absolute change
colors = ['#27AE60' if x > 0 else '#E74C3C' for x in renewable_data['yoy_change'].iloc[1:]]
ax3.fill_between(
    renewable_data['year'].iloc[1:],
    0,
    renewable_data['yoy_change'].iloc[1:],
    color='#808080',
    alpha=0.4,
    linewidth=0
)

ax3.plot(
    renewable_data['year'].iloc[1:],
    renewable_data['yoy_change'].iloc[1:],
    color='#2C2C2C',
    linewidth=2.5,
    marker='o',
    markersize=6,
    markerfacecolor='#2C2C2C',
    markeredgecolor='white',
    markeredgewidth=1
)

# Add zero line
ax3.axhline(y=0, color='black', linestyle='-', linewidth=1.5, alpha=0.7)

# Formatting
ax3.set_xlabel('Year', fontsize=14, fontweight='bold', labelpad=10)
ax3.set_ylabel('Year-over-Year Change (Percentage Points)', fontsize=14, fontweight='bold', labelpad=10)
ax3.set_title('Renewable Energy Consumption: Annual Change (2008-2020)\nYear-over-Year Growth in Renewable Energy Share', 
              fontsize=16, fontweight='bold', pad=20)

# Set x-axis ticks
ax3.set_xticks(range(2008, 2021, 2))
ax3.set_xticks(range(2008, 2021), minor=True)

# Format y-axis
y_change_max = abs(renewable_data['yoy_change'].iloc[1:]).max()
ax3.set_ylim(-y_change_max - 0.5, y_change_max + 0.5)
ax3.set_yticks(np.arange(-y_change_max - 0.5, y_change_max + 0.5, 0.5))
ax3.set_yticks(np.arange(-y_change_max - 0.5, y_change_max + 0.5, 0.1), minor=True)

# Grid
ax3.grid(True, which='major', linestyle='-', linewidth=0.8, color='#CCCCCC', alpha=0.5)
ax3.grid(True, which='minor', linestyle='--', linewidth=0.5, color='#E0E0E0', alpha=0.3)

# Remove top and right spines
ax3.spines['top'].set_visible(False)
ax3.spines['right'].set_visible(False)
ax3.spines['left'].set_color('#666666')
ax3.spines['bottom'].set_color('#666666')

# Format y-axis labels
ax3.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{x:.2f}'))

plt.tight_layout()
output_path3 = Path("renewable_energy_yoy_change_area_chart.png")
plt.savefig(output_path3, dpi=300, bbox_inches='tight', facecolor='white')
print(f"Saved: {output_path3}")

# Print summary statistics
print("\n" + "=" * 80)
print("SUMMARY STATISTICS")
print("=" * 80)
print(f"\nRenewable Energy Consumption Growth (2008-2020):")
print(f"  Starting Renewable Energy: {renewable_data['renewable_energy_percent'].iloc[0]:.2f}%")
print(f"  Ending Renewable Energy: {renewable_data['renewable_energy_percent'].iloc[-1]:.2f}%")
print(f"  Total Growth: {renewable_data['renewable_energy_percent'].iloc[-1] - renewable_data['renewable_energy_percent'].iloc[0]:.2f} percentage points")
print(f"  Percentage Change: {((renewable_data['renewable_energy_percent'].iloc[-1] / renewable_data['renewable_energy_percent'].iloc[0]) - 1) * 100:.2f}%")

print(f"\nYear-over-Year Changes:")
print(f"  Average Annual Change: {renewable_data['yoy_change'].iloc[1:].mean():.2f} percentage points")
print(f"  Largest Increase: {renewable_data['yoy_change'].iloc[1:].max():.2f} percentage points ({renewable_data.loc[renewable_data['yoy_change'].idxmax(), 'year']:.0f})")
print(f"  Largest Decrease: {renewable_data['yoy_change'].iloc[1:].min():.2f} percentage points")

# Calculate correlation with urbanization if available
if 'urban_population_percent_weighted' in comparison_data.columns:
    correlation = comparison_data['renewable_energy_percent'].corr(
        comparison_data['urban_population_percent_weighted']
    )
    print(f"\nCorrelation Analysis:")
    print(f"  Renewable Energy vs Urbanization Correlation: {correlation:.4f}")
    if correlation > 0.7:
        print("  -> Strong positive correlation: Urbanization strongly associated with renewable energy adoption")
    elif correlation > 0.4:
        print("  -> Moderate positive correlation: Urbanization moderately associated with renewable energy")
    elif correlation > -0.4:
        print("  -> Weak correlation: Limited direct association")
    else:
        print("  -> Negative correlation: Inverse relationship observed")

print("\n" + "=" * 80)
print("All charts created successfully!")
print("=" * 80)