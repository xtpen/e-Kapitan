import React from 'react';
import { Card } from './Card';
import { IconTile, type IconTileTone } from './IconTile';

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  /** Admin variant shows an icon tile above the label. */
  icon?: React.ReactNode;
  iconTone?: IconTileTone;
}

/** Muted label + big Poppins number. See DESIGN.md section 5.4. */
export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, iconTone }) => (
  <Card>
    {icon && <IconTile tone={iconTone} className="mb-3.5">{icon}</IconTile>}
    <span className="text-meta text-muted">{label}</span>
    <div className="font-display text-stat leading-none font-bold text-navy mt-2">{value}</div>
  </Card>
);
