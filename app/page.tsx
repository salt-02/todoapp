"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Calendar, Tag } from "lucide-react"
import { cn } from "@/lib/utils"

interface Todo {
  id: string
  title: string
  completed: boolean
  tags: string[]
  color: string
  dueDate?: Date
  reminderShown?: boolean
}

const COLOR_OPTIONS = [
  { name: "Default", value: "gray", class: "border-l-gray-400" },
  { name: "Red", value: "red", class: "border-l-red-400" },
  { name: "Blue", value: "blue", class: "border-l-blue-400" },
  { name: "Yellow", value: "yellow", class: "border-l-yellow-400" },
  { name: "Purple", value: "purple", class: "border-l-purple-400" },
  { name: "Pink", value: "pink", class: "border-l-pink-400" },
]

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTitle, setNewTitle] = useState("")
  const [newTags, setNewTags] = useState("")
  const [newColor, setNewColor] = useState("gray")
  const [newDueDate, setNewDueDate] = useState("")
  const [newDueTime, setNewDueTime] = useState("")
  const [notifications, setNotifications] = useState<string[]>([])
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")

  // Request notification permission on first reminder
  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window && notificationPermission === "default") {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      return permission
    }
    return notificationPermission
  }, [notificationPermission])

  // Check for due reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date()
      setTodos((prevTodos) =>
        prevTodos.map((todo) => {
          if (todo.dueDate && !todo.reminderShown && !todo.completed && todo.dueDate <= now) {
            // Show toast notification
            const message = `Reminder: ${todo.title}`
            setNotifications((prev) => [...prev, message])

            // Show system notification if permission granted
            if (notificationPermission === "granted") {
              new Notification("Todo Reminder", {
                body: todo.title,
                icon: "/favicon.ico",
              })
            }

            return { ...todo, reminderShown: true }
          }
          return todo
        }),
      )
    }

    const interval = setInterval(checkReminders, 1000) // Check every second
    return () => clearInterval(interval)
  }, [notificationPermission])

  // Remove notifications after 5 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications((prev) => prev.slice(1))
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notifications])

  const addTodo = async () => {
    if (!newTitle.trim()) return

    let dueDate: Date | undefined
    if (newDueDate && newDueTime) {
      dueDate = new Date(`${newDueDate}T${newDueTime}`)
      // Request permission when first reminder is set
      await requestNotificationPermission()
    }

    const todo: Todo = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      completed: false,
      tags: newTags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag),
      color: newColor,
      dueDate,
      reminderShown: false,
    }

    setTodos((prev) => [...prev, todo])
    setNewTitle("")
    setNewTags("")
    setNewColor("gray")
    setNewDueDate("")
    setNewDueTime("")
  }

  const toggleTodo = (id: string) => {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)))
  }

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id))
  }

  const formatDueDate = (date: Date) => {
    return date.toLocaleString("ja-JP", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification, index) => (
          <div
            key={index}
            className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-right"
          >
            {notification}
          </div>
        ))}
      </div>

      <div className="container mx-auto max-w-2xl p-4">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600 mb-2">Todo App</h1>
          <p className="text-muted-foreground">シンプルなタスク管理アプリ</p>
        </header>

        {/* Add Todo Form */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Title Input */}
              <div>
                <Input
                  placeholder="新しいタスクを入力..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTodo()}
                  className="focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Tags Input */}
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="タグ (カンマ区切り)"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="flex-1"
                />
              </div>

              {/* Date and Time Inputs */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="time"
                  value={newDueTime}
                  onChange={(e) => setNewDueTime(e.target.value)}
                  className="flex-1"
                  disabled={!newDueDate}
                />
              </div>

              {/* Color Picker */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">色:</span>
                <div className="flex gap-1">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewColor(color.value)}
                      className={cn(
                        "w-6 h-6 rounded border-2 transition-all",
                        color.class.replace("border-l-", "bg-"),
                        newColor === color.value ? "ring-2 ring-green-500" : "ring-1 ring-border",
                      )}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Add Button */}
              <Button onClick={addTodo} className="w-full bg-green-600 hover:bg-green-700" disabled={!newTitle.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                追加
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Todo List */}
        <div className="space-y-2">
          {todos.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                タスクがありません。新しいタスクを追加してください。
              </CardContent>
            </Card>
          ) : (
            todos.map((todo) => {
              const colorClass = COLOR_OPTIONS.find((c) => c.value === todo.color)?.class || "border-l-gray-400"

              return (
                <Card key={todo.id} className={cn("border-l-4", colorClass)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => toggleTodo(todo.id)}
                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className={cn("font-medium", todo.completed && "line-through text-muted-foreground")}>
                          {todo.title}
                        </div>

                        {/* Tags */}
                        {todo.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {todo.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Due Date */}
                        {todo.dueDate && (
                          <div
                            className={cn(
                              "text-xs mt-1",
                              todo.dueDate < new Date() && !todo.completed
                                ? "text-red-500 font-medium"
                                : "text-muted-foreground",
                            )}
                          >
                            期限: {formatDueDate(todo.dueDate)}
                          </div>
                        )}
                      </div>

                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTodo(todo.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
