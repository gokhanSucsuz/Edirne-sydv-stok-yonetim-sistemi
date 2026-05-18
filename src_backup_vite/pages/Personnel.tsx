import React, { useEffect, useState } from 'react';
import { getPersonnel, addPersonnel, deletePersonnel, Personnel as PersonnelType } from '../lib/db';
import { Plus, Trash2, UserCircle } from 'lucide-react';

export default function Personnel() {
  const [personnelList, setPersonnelList] = useState<PersonnelType[]>([]);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [tcNo, setTcNo] = useState('');

  const loadPersonnel = async () => {
    const data = await getPersonnel();
    setPersonnelList(data);
  };

  useEffect(() => {
    loadPersonnel();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !title) return;

    await addPersonnel({ name, title, tcNo, email: '' });
    setName('');
    setTitle('');
    setTcNo('');
    loadPersonnel();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu personeli silmek istediğinize emin misiniz?')) {
      await deletePersonnel(id);
      loadPersonnel();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Personel Yönetimi</h1>
      </div>

      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Yeni Personel Ekle</h3>
            <p className="mt-1 text-sm text-gray-500">
              Sistemi kullanacak ve stok işlemlerini gerçekleştirecek personelleri buradan ekleyebilirsiniz.
              Sistemde işlem yapabilmek için en az bir personel kaydı zorunludur.
            </p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Ad Soyad</label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">Ünvan / Görev</label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="tcNo" className="block text-sm font-medium text-gray-700">TC Kimlik No (Opsiyonel)</label>
                  <input
                    type="text"
                    name="tcNo"
                    id="tcNo"
                    value={tcNo}
                    onChange={(e) => setTcNo(e.target.value)}
                    className="mt-1 focus:ring-red-500 focus:border-red-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Kayıtlı Personeller</h3>
        </div>
        <div className="border-t border-gray-200">
          {personnelList.length === 0 ? (
            <div className="text-center py-12">
              <UserCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Personel Bulunamadı</h3>
              <p className="mt-1 text-sm text-gray-500">Sistemde kayıtlı personel bulunmamaktadır. Lütfen yeni personel ekleyin.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {personnelList.map((person) => (
                <li key={person.id} className="px-4 py-4 flex items-center justify-between sm:px-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="text-red-800 font-medium text-sm">
                          {person.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{person.name}</div>
                      <div className="text-sm text-gray-500">{person.title} {person.tcNo && `- TC: ${person.tcNo}`}</div>
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={() => person.id && handleDelete(person.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
