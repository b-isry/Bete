"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Icon,
  ImageDropzone,
  Input,
  Select,
  Textarea,
  useToast,
  type ImageDropzoneItem,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  aiWriteDescription,
  ApiError,
  createProperty,
  type PropertyCreatePayload,
} from "@/lib/api";
import { MOCK_ADMIN_CATEGORIES, MOCK_CITIES, mockAiDescription } from "@/lib/mocks";

export default function NewListingPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { push } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dealType, setDealType] = useState<"SALE" | "RENT">("SALE");
  const [propertyType, setPropertyType] = useState<
    "HOUSE" | "APARTMENT" | "LAND" | "COMMERCIAL"
  >("APARTMENT");
  const [price, setPrice] = useState("");
  const [areaSqm, setAreaSqm] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [locationText, setLocationText] = useState("");
  const [cityId, setCityId] = useState(String(MOCK_CITIES[0].id));
  const [categoryId, setCategoryId] = useState(
    String(MOCK_ADMIN_CATEGORIES[0].id),
  );
  const [lat, setLat] = useState("9.03");
  const [lng, setLng] = useState("38.74");
  const [images, setImages] = useState<ImageDropzoneItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  async function onWriteForMe() {
    setAiBusy(true);
    try {
      const result = await aiWriteDescription({
        title: title || "Property",
        location_text: locationText || "Addis Ababa",
        property_type: propertyType,
      });
      setDescription(result.description);
      push(t("listings.new.aiDone"), "success");
    } catch {
      setDescription(
        mockAiDescription({
          title: title || "Property",
          location_text: locationText || "Addis Ababa",
          property_type: propertyType,
        }),
      );
      push(t("listings.new.aiFallback"), "info");
    } finally {
      setAiBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (images.length === 0) {
      push(t("listings.new.needImages"), "error");
      return;
    }

    const payload: PropertyCreatePayload = {
      title: title.trim(),
      description: description.trim(),
      deal_type: dealType,
      property_type: propertyType,
      price: price.trim(),
      location_text: locationText.trim(),
      lat: Number(lat),
      lng: Number(lng),
      city_id: Number(cityId),
      category_id: Number(categoryId),
      images: images.map((img) => ({
        image_url: img.image_url.startsWith("blob:")
          ? "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80"
          : img.image_url,
        image_hash: img.image_hash,
      })),
    };

    if (areaSqm.trim()) payload.area_sqm = areaSqm.trim();
    if (bedrooms.trim()) payload.bedrooms = Number(bedrooms);
    if (bathrooms.trim()) payload.bathrooms = Number(bathrooms);

    setBusy(true);
    try {
      const result = await createProperty(payload);
      push(t("listings.new.success"), "success");
      router.push(`/properties/${result.property.id}`);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t("listings.new.error");
      push(message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
      <p className="mb-2 font-sans text-label-sm uppercase tracking-[0.2em] text-secondary">
        {t("listings.new.eyebrow")}
      </p>
      <h1 className="mb-2 font-serif text-headline-md text-primary">
        {t("listings.new.title")}
      </h1>
      <p className="mb-8 font-body text-body-md text-on-surface-variant">
        {t("listings.new.subtitle")}
      </p>

      <Card>
        <form className="space-y-8" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
              {t("listings.new.fields.title")}
            </span>
            <Input
              variant="underline"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={5}
            />
          </label>

          <div>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <span className="font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
                {t("listings.new.fields.description")}
              </span>
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                disabled={aiBusy}
                onClick={() => {
                  void onWriteForMe();
                }}
              >
                <Icon name="auto_awesome" />
                {t("listings.new.writeForMe")}
              </Button>
            </div>
            <Textarea
              variant="underline"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={10}
              rows={6}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
                {t("listings.new.fields.dealType")}
              </span>
              <Select
                variant="underline"
                className="w-full"
                value={dealType}
                onChange={(e) =>
                  setDealType(e.target.value as "SALE" | "RENT")
                }
              >
                <option value="SALE">{t("search.buy")}</option>
                <option value="RENT">{t("search.rent")}</option>
              </Select>
            </label>

            <label className="block">
              <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
                {t("listings.new.fields.propertyType")}
              </span>
              <Select
                variant="underline"
                className="w-full"
                value={propertyType}
                onChange={(e) =>
                  setPropertyType(
                    e.target.value as
                      | "HOUSE"
                      | "APARTMENT"
                      | "LAND"
                      | "COMMERCIAL",
                  )
                }
              >
                <option value="APARTMENT">
                  {t("propertyTypes.APARTMENT")}
                </option>
                <option value="HOUSE">{t("propertyTypes.HOUSE")}</option>
                <option value="LAND">{t("propertyTypes.LAND")}</option>
                <option value="COMMERCIAL">
                  {t("propertyTypes.COMMERCIAL")}
                </option>
              </Select>
            </label>

            <label className="block">
              <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
                {t("listings.new.fields.price")}
              </span>
              <Input
                variant="underline"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="2500000"
                required
              />
            </label>

            <label className="block">
              <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
                {t("listings.new.fields.area")}
              </span>
              <Input
                variant="underline"
                inputMode="decimal"
                value={areaSqm}
                onChange={(e) => setAreaSqm(e.target.value)}
                placeholder="120"
              />
            </label>

            <label className="block">
              <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
                {t("listings.new.fields.bedrooms")}
              </span>
              <Input
                variant="underline"
                inputMode="numeric"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
                {t("listings.new.fields.bathrooms")}
              </span>
              <Input
                variant="underline"
                inputMode="numeric"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
              {t("listings.new.fields.location")}
            </span>
            <Input
              variant="underline"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              placeholder="Bole, Addis Ababa"
              required
            />
          </label>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
                {t("filters.city")}
              </span>
              <Select
                variant="underline"
                className="w-full"
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
              >
                {MOCK_CITIES.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </Select>
            </label>

            <label className="block">
              <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
                {t("listings.new.fields.category")}
              </span>
              <Select
                variant="underline"
                className="w-full"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {MOCK_ADMIN_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </label>

            <label className="block">
              <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
                {t("listings.new.fields.lat")}
              </span>
              <Input
                variant="underline"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
                {t("listings.new.fields.lng")}
              </span>
              <Input
                variant="underline"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                required
              />
            </label>
          </div>

          <ImageDropzone
            value={images}
            onChange={setImages}
            max={10}
            label={t("listings.new.fields.photos")}
            hint={t("listings.new.photosHint")}
          />

          <div className="flex flex-wrap gap-3 border-t border-outline-variant pt-6">
            <Button type="submit" variant="primary" disabled={busy}>
              {t("listings.new.submit")}
            </Button>
            <p className="font-body text-body-md text-on-surface-variant">
              {t("listings.new.pendingNote")}
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}
