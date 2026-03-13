import React from 'react';
import { Pencil, Trash2, Cloud, CloudRain, Sun } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';
import { Button } from '../ui/Button';
import { Tag } from '../ui/Tag';
import { Badge } from '../ui/Badge';
import { IconWrapper } from '../ui/IconWrapper';

export interface GroupData {
  id: string;
  name: string;
  tutor?: string;
  stage?: 'eso' | 'fp' | 'brand';
  occupancy?: number;
  year?: string;
  studentsCount?: number;
  risk?: { low: number; high: number; medium: number };
  climate?: 'sunny' | 'cloudy' | 'rainy';
  intervention?: string;
}

interface GroupsTableProps {
  groups: GroupData[];
  role: 'admin' | 'edu'; 
}

export const GroupsTable: React.FC<GroupsTableProps> = ({ groups, role }) => {
  const isAdmin = role === 'admin';

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {isAdmin && <TableHead sortable className="w-20">ID</TableHead>}
          <TableHead sortable className={isAdmin ? 'w-32' : 'w-40'}>Grupo</TableHead>
          
          {isAdmin ? (
            <>
              <TableHead sortable>Tutor</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead className="w-32">Ocupación</TableHead>
              <TableHead sortable>Año</TableHead>
            </>
          ) : (
            <>
              <TableHead sortable>Alumnos</TableHead>
              <TableHead>Riesgo</TableHead>
              <TableHead className="text-center">Clima</TableHead>
              <TableHead>Intervención</TableHead>
            </>
          )}
          
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      
      <TableBody>
        {groups.map((group) => (
          <TableRow key={group.id}>
            
            {isAdmin && (
              <TableCell className="text-text-muted text-xs font-mono">
                #{group.id}
              </TableCell>
            )}
            
            <TableCell className="font-bold text-text-main">
              {group.name}
            </TableCell>

            {isAdmin ? (
              <>
                <TableCell className="text-text-body">{group.tutor}</TableCell>
                <TableCell>
                  {group.stage && <Tag label={group.stage.toUpperCase()} theme={group.stage} />}
                </TableCell>
                <TableCell>
                   <div className="flex flex-col gap-1 w-24">
                     <span className="text-xs text-text-body">{group.occupancy}%</span>
                     <div className="w-full h-1 bg-border-line rounded-full overflow-hidden">
                       <div className="h-full bg-brand-primary" style={{ width: `${group.occupancy}%` }} />
                     </div>
                   </div>
                </TableCell>
                <TableCell className="text-text-body">{group.year}</TableCell>
              </>
            ) : (
              <>
                <TableCell className="text-text-body font-medium">
                  {group.studentsCount}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Badge label={String(group.risk?.low || 0)} variant="green" />
                    <Badge label={String(group.risk?.high || 0)} variant="red" />
                    <Badge label={String(group.risk?.medium || 0)} variant="yellow" />
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <IconWrapper 
                    icon={group.climate === 'sunny' ? <Sun size={16} /> : <Cloud size={16} />} 
                    variant="transparent" 
                    theme="info" 
                  />
                </TableCell>
                <TableCell>
                  <Badge label={group.intervention || 'Al día'} variant="green" withDot />
                </TableCell>
              </>
            )}
            
            <TableCell>
              <div className="flex items-center justify-end gap-2">
                <Button variant="icon-only" icon={<Pencil size={16} />} aria-label="Editar" />
                <Button variant="icon-only" icon={<Trash2 size={16} />} className="text-state-error hover:bg-state-error-subtle/50" aria-label="Eliminar" />
              </div>
            </TableCell>
            
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};