export interface CreateDepartmentDto {
  name: string;
  description?: string;
  headOfDepartment?: string;
}

export interface UpdateDepartmentDto {
  name?: string;
  description?: string;
  headOfDepartment?: string;
}
