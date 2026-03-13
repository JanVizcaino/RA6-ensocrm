import React from 'react';
import { Pencil } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  lastAccess?: string;
  status?: 'active' | 'inactive';
}

interface UsersTableProps {
  users: UserData[];
}

export const UsersTable: React.FC<UsersTableProps> = ({ users }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead sortable className="w-24">ID</TableHead>
          <TableHead sortable className="w-48">Usuario</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Contacto</TableHead>
          <TableHead sortable>Último Acceso</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="text-text-muted text-xs font-mono">
              #{user.id}
            </TableCell>
            
            <TableCell>
              <div className="flex flex-col justify-start items-start gap-0.5">
                <span className="font-bold text-text-main text-sm">{user.name}</span>
              </div>
            </TableCell>

            <TableCell>
              <Badge 
                label={user.role || 'Sin Rol'} 
                variant={user.role === 'Admin' ? 'red' : user.role === 'Gestor' ? 'yellow' : 'blue'} 
              />
            </TableCell>

            <TableCell className="text-text-body text-sm">
              {user.email}
            </TableCell>

            <TableCell className="text-text-body text-sm">
              {user.lastAccess || 'Nunca'}
            </TableCell>

            <TableCell>
              <Badge 
                label={user.status === 'active' ? 'Activo' : 'Inactivo'} 
                variant={user.status === 'active' ? 'green' : 'gray'} 
                withDot 
              />
            </TableCell>
            
            <TableCell>
              <div className="flex items-center justify-end gap-2">
                <Button variant="icon-only" icon={<Pencil size={16} />} aria-label="Editar Usuario" />
              </div>
            </TableCell>
            
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};