export default function TestEditPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Edit Page Test</h1>
        <p className="text-lg">Project ID: {params.id}</p>
        <p className="text-sm text-gray-600">This is a test to verify the route is working</p>
      </div>
    </div>
  )
}