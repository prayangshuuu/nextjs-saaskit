"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Shield } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Role {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    permissions: number;
  };
}

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
}

export default function RolesPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/v1/admin/roles");
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch("/api/v1/admin/permissions");
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions || []);
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
    }
  };

  const handleCreateRole = async () => {
    try {
      const response = await fetch("/api/v1/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Role created successfully",
        });
        setRoleModalOpen(false);
        resetForm();
        fetchRoles();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to create role",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;

    try {
      const response = await fetch(`/api/v1/admin/roles/${editingRole.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Role updated successfully",
        });
        setRoleModalOpen(false);
        setEditingRole(null);
        resetForm();
        fetchRoles();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to update role",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRole = async (id: string, name: string) => {
    if (name === "ADMIN" || name === "USER") {
      toast({
        title: "Error",
        description: "Cannot delete system roles",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this role?")) return;

    try {
      const response = await fetch(`/api/v1/admin/roles/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Role deleted successfully",
        });
        fetchRoles();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to delete role",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      });
    }
  };

  const handleEditPermissions = async (role: Role) => {
    setSelectedRole(role);
    try {
      const response = await fetch(`/api/v1/admin/roles/${role.id}/permissions`);
      if (response.ok) {
        const data = await response.json();
        setSelectedPermissions(
          data.role.permissions.map((rp: any) => rp.permission.id)
        );
        setPermissionModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch role permissions:", error);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;

    try {
      const response = await fetch(
        `/api/v1/admin/roles/${selectedRole.id}/permissions`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissionIds: selectedPermissions }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Permissions updated successfully",
        });
        setPermissionModalOpen(false);
        setSelectedRole(null);
        setSelectedPermissions([]);
        fetchRoles();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to update permissions",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (role: Role) => {
    if (role.name === "ADMIN" || role.name === "USER") {
      toast({
        title: "Error",
        description: "Cannot edit system roles",
        variant: "destructive",
      });
      return;
    }
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
    });
    setRoleModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    });
    setEditingRole(null);
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return <div className="p-6">Loading roles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Role & Permission Management</h1>
          <p className="text-muted-foreground">
            Manage roles and their permissions
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setRoleModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>All system roles</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No roles found
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">{role.name}</span>
                        {(role.name === "ADMIN" || role.name === "USER") && (
                          <span className="text-xs px-2 py-0.5 rounded bg-muted">
                            System
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{role.description || "-"}</TableCell>
                    <TableCell>{role._count.users}</TableCell>
                    <TableCell>{role._count.permissions}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPermissions(role)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {role.name !== "ADMIN" && role.name !== "USER" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(role)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRole(role.id, role.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Create/Edit Modal */}
      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit Role" : "Create Role"}
            </DialogTitle>
            <DialogDescription>
              {editingRole
                ? "Update role information"
                : "Create a new role"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value.toUpperCase() })
                }
                required
                disabled={!!editingRole}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setRoleModalOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={editingRole ? handleUpdateRole : handleCreateRole}>
                {editingRole ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permission Assignment Modal */}
      <Dialog open={permissionModalOpen} onOpenChange={setPermissionModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Permissions: {selectedRole?.name}
            </DialogTitle>
            <DialogDescription>
              Select permissions for this role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {Object.entries(groupedPermissions).map(([resource, perms]) => (
              <div key={resource} className="space-y-2">
                <h4 className="font-semibold">{resource}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {perms.map((perm) => (
                    <div key={perm.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={perm.id}
                        checked={selectedPermissions.includes(perm.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPermissions([...selectedPermissions, perm.id]);
                          } else {
                            setSelectedPermissions(
                              selectedPermissions.filter((id) => id !== perm.id)
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor={perm.id}
                        className="text-sm cursor-pointer"
                      >
                        {perm.action}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setPermissionModalOpen(false);
                  setSelectedRole(null);
                  setSelectedPermissions([]);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSavePermissions}>
                Save Permissions
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

