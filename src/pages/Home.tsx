import React from 'react';
import { Link } from 'react-router-dom';
import { Gift, Share2, Shield, Activity } from 'lucide-react';

export function Home() {
  return (
    <div className="space-y-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Create Memorable Digital Greetings
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Design beautiful digital greeting cards with rich text, images, and videos. Share them securely with your loved ones.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            to="/create"
            className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Get started
          </Link>
          <Link to="/examples" className="text-sm font-semibold leading-6 text-gray-900">
            View examples <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Features</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to create perfect greetings
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                <Gift className="h-5 w-5 flex-none text-indigo-600" />
                Rich Content Editor
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">Create beautiful greetings with our intuitive rich text editor. Add images, videos, and format text exactly how you want.</p>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                <Shield className="h-5 w-5 flex-none text-indigo-600" />
                Secure Sharing
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">Choose between public links or secure access codes. Control who can view your greetings.</p>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                <Activity className="h-5 w-5 flex-none text-indigo-600" />
                Analytics Dashboard
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">Track who viewed your greetings and when. Get insights into how your greetings are being received.</p>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}