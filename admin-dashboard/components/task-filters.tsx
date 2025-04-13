"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import type { Department, PriorityLevel, TaskStatus } from "@/lib/types"
import { ChevronDown, Filter, Search, SortAsc } from "lucide-react"

export type SortOption = "dueDate" | "priority" | "status" | "title"
export type SortDirection = "asc" | "desc"

interface TaskFiltersProps {
  departments: Department[]
  statuses: TaskStatus[]
  priorities: PriorityLevel[]
  selectedDepartments: Department[]
  selectedStatuses: TaskStatus[]
  selectedPriorities: PriorityLevel[]
  sortBy: SortOption
  sortDirection: SortDirection
  searchQuery: string
  onDepartmentChange: (departments: Department[]) => void
  onStatusChange: (statuses: TaskStatus[]) => void
  onPriorityChange: (priorities: PriorityLevel[]) => void
  onSortChange: (sortBy: SortOption, direction: SortDirection) => void
  onSearchChange: (query: string) => void
}

export function TaskFilters({
  departments,
  statuses,
  priorities,
  selectedDepartments,
  selectedStatuses,
  selectedPriorities,
  sortBy,
  sortDirection,
  searchQuery,
  onDepartmentChange,
  onStatusChange,
  onPriorityChange,
  onSortChange,
  onSearchChange,
}: TaskFiltersProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Department
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by Department</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {departments.map((department) => (
                  <DropdownMenuCheckboxItem
                    key={department}
                    checked={selectedDepartments.includes(department)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onDepartmentChange([...selectedDepartments, department])
                      } else {
                        onDepartmentChange(selectedDepartments.filter((d) => d !== department))
                      }
                    }}
                  >
                    {department}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Status
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {statuses.map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={selectedStatuses.includes(status)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onStatusChange([...selectedStatuses, status])
                      } else {
                        onStatusChange(selectedStatuses.filter((s) => s !== status))
                      }
                    }}
                  >
                    {status}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Priority
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {priorities.map((priority) => (
                  <DropdownMenuCheckboxItem
                    key={priority}
                    checked={selectedPriorities.includes(priority)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onPriorityChange([...selectedPriorities, priority])
                      } else {
                        onPriorityChange(selectedPriorities.filter((p) => p !== priority))
                      }
                    }}
                  >
                    {priority}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <SortAsc className="mr-2 h-4 w-4" />
                  Sort
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={sortBy === "dueDate"}
                  onCheckedChange={() => onSortChange("dueDate", sortDirection)}
                >
                  Due Date
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={sortBy === "priority"}
                  onCheckedChange={() => onSortChange("priority", sortDirection)}
                >
                  Priority
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={sortBy === "status"}
                  onCheckedChange={() => onSortChange("status", sortDirection)}
                >
                  Status
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={sortBy === "title"}
                  onCheckedChange={() => onSortChange("title", sortDirection)}
                >
                  Title
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Direction</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={sortDirection === "asc"}
                  onCheckedChange={() => onSortChange(sortBy, "asc")}
                >
                  Ascending
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={sortDirection === "desc"}
                  onCheckedChange={() => onSortChange(sortBy, "desc")}
                >
                  Descending
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

