// Mock Firestore for demo purposes
export interface MockDoc {
  id: string
  data: any
  createdAt: Date
  updatedAt: Date
}

export interface MockCollection {
  [docId: string]: MockDoc
}

class MockFirestore {
  private collections: { [collectionName: string]: MockCollection } = {}

  constructor() {
    // Load data from localStorage
    const stored = localStorage.getItem("mock-firestore-data")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Convert date strings back to Date objects
        Object.keys(parsed).forEach((collectionName) => {
          this.collections[collectionName] = {}
          Object.keys(parsed[collectionName]).forEach((docId) => {
            const doc = parsed[collectionName][docId]
            this.collections[collectionName][docId] = {
              ...doc,
              createdAt: new Date(doc.createdAt),
              updatedAt: new Date(doc.updatedAt),
              data: {
                ...doc.data,
                // Convert any date fields in data
                ...(doc.data.createdAt && { createdAt: new Date(doc.data.createdAt) }),
                ...(doc.data.updatedAt && { updatedAt: new Date(doc.data.updatedAt) }),
                ...(doc.data.dueDate && { dueDate: new Date(doc.data.dueDate) }),
              },
            }
          })
        })
      } catch (error) {
        console.error("Error loading mock firestore data:", error)
      }
    }
  }

  private saveToStorage() {
    localStorage.setItem("mock-firestore-data", JSON.stringify(this.collections))
  }

  private generateId(): string {
    return "mock_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
  }

  collection(name: string) {
    if (!this.collections[name]) {
      this.collections[name] = {}
    }
    return {
      add: (data: any) => this.addDoc(name, data),
      doc: (id: string) => this.doc(name, id),
      where: (field: string, operator: string, value: any) => this.query(name, field, operator, value),
      orderBy: (field: string, direction: "asc" | "desc" = "asc") => this.orderBy(name, field, direction),
      onSnapshot: (callback: (snapshot: any) => void) => this.onSnapshot(name, callback),
    }
  }

  private addDoc(collectionName: string, data: any): Promise<{ id: string }> {
    return new Promise((resolve) => {
      const id = this.generateId()
      const now = new Date()

      this.collections[collectionName][id] = {
        id,
        data: { ...data, createdAt: now, updatedAt: now },
        createdAt: now,
        updatedAt: now,
      }

      this.saveToStorage()
      this.notifyListeners(collectionName)

      resolve({ id })
    })
  }

  private doc(collectionName: string, id: string) {
    return {
      update: (data: any) => this.updateDoc(collectionName, id, data),
      delete: () => this.deleteDoc(collectionName, id),
      get: () => this.getDoc(collectionName, id),
    }
  }

  private updateDoc(collectionName: string, id: string, updates: any): Promise<void> {
    return new Promise((resolve) => {
      if (this.collections[collectionName] && this.collections[collectionName][id]) {
        const doc = this.collections[collectionName][id]
        doc.data = { ...doc.data, ...updates, updatedAt: new Date() }
        doc.updatedAt = new Date()

        this.saveToStorage()
        this.notifyListeners(collectionName)
      }
      resolve()
    })
  }

  private deleteDoc(collectionName: string, id: string): Promise<void> {
    return new Promise((resolve) => {
      if (this.collections[collectionName]) {
        delete this.collections[collectionName][id]
        this.saveToStorage()
        this.notifyListeners(collectionName)
      }
      resolve()
    })
  }

  private getDoc(collectionName: string, id: string): Promise<any> {
    return new Promise((resolve) => {
      const doc = this.collections[collectionName]?.[id]
      resolve({
        exists: () => !!doc,
        data: () => doc?.data,
        id: doc?.id,
      })
    })
  }

  private query(collectionName: string, field: string, operator: string, value: any) {
    return {
      orderBy: (orderField: string, direction: "asc" | "desc" = "asc") =>
        this.queryWithOrder(collectionName, field, operator, value, orderField, direction),
      onSnapshot: (callback: (snapshot: any) => void) =>
        this.onSnapshotWithQuery(collectionName, field, operator, value, callback),
    }
  }

  private orderBy(collectionName: string, field: string, direction: "asc" | "desc" = "asc") {
    return {
      onSnapshot: (callback: (snapshot: any) => void) =>
        this.onSnapshotWithOrder(collectionName, field, direction, callback),
    }
  }

  private queryWithOrder(
    collectionName: string,
    field: string,
    operator: string,
    value: any,
    orderField: string,
    direction: "asc" | "desc",
  ) {
    return {
      onSnapshot: (callback: (snapshot: any) => void) =>
        this.onSnapshotWithQueryAndOrder(collectionName, field, operator, value, orderField, direction, callback),
    }
  }

  private listeners: { [key: string]: ((snapshot: any) => void)[] } = {}

  private onSnapshot(collectionName: string, callback: (snapshot: any) => void) {
    const key = collectionName
    if (!this.listeners[key]) {
      this.listeners[key] = []
    }
    this.listeners[key].push(callback)

    // Immediately call with current data
    this.callSnapshot(collectionName, null, null, null, null, null, callback)

    // Return unsubscribe function
    return () => {
      const index = this.listeners[key].indexOf(callback)
      if (index > -1) {
        this.listeners[key].splice(index, 1)
      }
    }
  }

  private onSnapshotWithQuery(
    collectionName: string,
    field: string,
    operator: string,
    value: any,
    callback: (snapshot: any) => void,
  ) {
    const key = `${collectionName}_${field}_${operator}_${value}`
    if (!this.listeners[key]) {
      this.listeners[key] = []
    }
    this.listeners[key].push(callback)

    // Immediately call with current data
    this.callSnapshot(collectionName, field, operator, value, null, null, callback)

    return () => {
      const index = this.listeners[key].indexOf(callback)
      if (index > -1) {
        this.listeners[key].splice(index, 1)
      }
    }
  }

  private onSnapshotWithOrder(
    collectionName: string,
    orderField: string,
    direction: "asc" | "desc",
    callback: (snapshot: any) => void,
  ) {
    const key = `${collectionName}_order_${orderField}_${direction}`
    if (!this.listeners[key]) {
      this.listeners[key] = []
    }
    this.listeners[key].push(callback)

    this.callSnapshot(collectionName, null, null, null, orderField, direction, callback)

    return () => {
      const index = this.listeners[key].indexOf(callback)
      if (index > -1) {
        this.listeners[key].splice(index, 1)
      }
    }
  }

  private onSnapshotWithQueryAndOrder(
    collectionName: string,
    field: string,
    operator: string,
    value: any,
    orderField: string,
    direction: "asc" | "desc",
    callback: (snapshot: any) => void,
  ) {
    const key = `${collectionName}_${field}_${operator}_${value}_order_${orderField}_${direction}`
    if (!this.listeners[key]) {
      this.listeners[key] = []
    }
    this.listeners[key].push(callback)

    this.callSnapshot(collectionName, field, operator, value, orderField, direction, callback)

    return () => {
      const index = this.listeners[key].indexOf(callback)
      if (index > -1) {
        this.listeners[key].splice(index, 1)
      }
    }
  }

  private callSnapshot(
    collectionName: string,
    field: string | null,
    operator: string | null,
    value: any,
    orderField: string | null,
    direction: "asc" | "desc" | null,
    callback: (snapshot: any) => void,
  ) {
    let docs = Object.values(this.collections[collectionName] || {})

    // Apply query filter
    if (field && operator && value !== undefined) {
      docs = docs.filter((doc) => {
        const fieldValue = doc.data[field]
        switch (operator) {
          case "==":
            return fieldValue === value
          case "!=":
            return fieldValue !== value
          case ">":
            return fieldValue > value
          case ">=":
            return fieldValue >= value
          case "<":
            return fieldValue < value
          case "<=":
            return fieldValue <= value
          default:
            return true
        }
      })
    }

    // Apply ordering
    if (orderField) {
      docs.sort((a, b) => {
        const aVal = a.data[orderField]
        const bVal = b.data[orderField]

        if (aVal instanceof Date && bVal instanceof Date) {
          return direction === "desc" ? bVal.getTime() - aVal.getTime() : aVal.getTime() - bVal.getTime()
        }

        if (direction === "desc") {
          return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
        } else {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
        }
      })
    }

    const snapshot = {
      forEach: (fn: (doc: any) => void) => {
        docs.forEach((doc) => {
          fn({
            id: doc.id,
            data: () => doc.data,
          })
        })
      },
      docs: docs.map((doc) => ({
        id: doc.id,
        data: () => doc.data,
      })),
    }

    callback(snapshot)
  }

  private notifyListeners(collectionName: string) {
    // Notify all listeners for this collection
    Object.keys(this.listeners).forEach((key) => {
      if (key.startsWith(collectionName)) {
        this.listeners[key].forEach((callback) => {
          // Re-call the snapshot with current data
          const parts = key.split("_")
          if (parts.length >= 4 && parts[1] !== "order") {
            // Query listener
            const field = parts[1]
            const operator = parts[2]
            const value = parts[3]
            if (parts.length > 4 && parts[4] === "order") {
              // Query with order
              const orderField = parts[5]
              const direction = parts[6] as "asc" | "desc"
              this.callSnapshot(collectionName, field, operator, value, orderField, direction, callback)
            } else {
              this.callSnapshot(collectionName, field, operator, value, null, null, callback)
            }
          } else if (parts.length >= 4 && parts[1] === "order") {
            // Order listener
            const orderField = parts[2]
            const direction = parts[3] as "asc" | "desc"
            this.callSnapshot(collectionName, null, null, null, orderField, direction, callback)
          } else {
            // Simple collection listener
            this.callSnapshot(collectionName, null, null, null, null, null, callback)
          }
        })
      }
    })
  }
}

export const mockFirestore = new MockFirestore()
