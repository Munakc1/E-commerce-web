export default function Contact() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Contact Us</h1>
      <div className="max-w-2xl">
        <p className="text-lg mb-6">
          Have questions? We'd love to hear from you.
        </p>
        <form className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">Name</label>
            <input type="text" className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block mb-2 font-medium">Email</label>
            <input type="email" className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block mb-2 font-medium">Message</label>
            <textarea className="w-full p-2 border rounded" rows={5}></textarea>
          </div>
          <button className="bg-thrift-green text-white px-6 py-2 rounded hover:bg-thrift-green/90">
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}