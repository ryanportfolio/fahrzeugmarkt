<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import ImageUploader from '../components/ImageUploader.vue'
import { api } from '../api'
import { errorMessage, fieldErrorsOf } from '../api/client'
import { bodyLabel, fuelLabel, transmissionLabel } from '../format'
import type {
  BodyType,
  FuelType,
  ListingImageDto,
  ListingInput,
  MetaDto,
  Transmission,
} from '../types'

const route = useRoute()
const router = useRouter()

const listingId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEdit = computed(() => listingId.value !== null)

const meta = ref<MetaDto | null>(null)
const images = ref<ListingImageDto[]>([])
const pending = ref<File[]>([])

const loading = ref(false)
const saving = ref(false)
const loadError = ref<string | null>(null)
const failure = ref<string | null>(null)
const imageError = ref<string | null>(null)

const errors = reactive<Record<string, string>>({})

const form = reactive({
  title: '',
  description: '',
  // v-model on <input type="number"> writes a number, not a string, so these
  // hold either depending on whether the field has been touched.
  priceEur: '' as string | number,
  makeName: '',
  modelName: '',
  bodyType: 'HATCHBACK' as BodyType,
  fuelType: 'PETROL' as FuelType,
  transmission: 'MANUAL' as Transmission,
  color: '',
  mileageKm: '' as string | number,
  powerKw: '' as string | number,
  doors: '' as string | number,
  seats: '' as string | number,
  firstRegistration: '',
  nextInspection: '',
})

const bodyOptions = computed<BodyType[]>(
  () =>
    meta.value?.bodyTypes ?? [
      'SEDAN',
      'ESTATE',
      'HATCHBACK',
      'SUV',
      'COUPE',
      'CONVERTIBLE',
      'VAN',
      'PICKUP',
    ],
)
const fuelOptions = computed<FuelType[]>(
  () => meta.value?.fuelTypes ?? ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'PLUG_IN_HYBRID', 'LPG'],
)
const transmissionOptions = computed<Transmission[]>(
  () => meta.value?.transmissions ?? ['MANUAL', 'AUTOMATIC'],
)
const modelSuggestions = computed(
  () => meta.value?.makes.find((make) => make.name === form.makeName)?.models ?? [],
)

function toMonthInput(isoDate: string | null): string {
  return isoDate ? isoDate.slice(0, 7) : ''
}

function toIsoDate(month: string): string | null {
  return month ? `${month}-01` : null
}

async function loadMeta() {
  try {
    meta.value = await api.meta()
  } catch {
    meta.value = null
  }
}

async function loadListing() {
  const id = listingId.value
  if (id === null) return
  loading.value = true
  loadError.value = null
  try {
    const detail = await api.listing(id)
    form.title = detail.title
    form.description = detail.description
    form.priceEur = String(detail.priceEur)
    form.makeName = detail.vehicle.make
    form.modelName = detail.vehicle.model
    form.bodyType = detail.vehicle.bodyType
    form.fuelType = detail.vehicle.fuelType
    form.transmission = detail.vehicle.transmission
    form.color = detail.vehicle.color
    form.mileageKm = String(detail.vehicle.mileageKm)
    form.powerKw = String(detail.vehicle.powerKw)
    form.doors = detail.vehicle.doors !== null ? String(detail.vehicle.doors) : ''
    form.seats = detail.vehicle.seats !== null ? String(detail.vehicle.seats) : ''
    form.firstRegistration = toMonthInput(detail.vehicle.firstRegistration)
    form.nextInspection = toMonthInput(detail.vehicle.nextInspection)
    images.value = [...detail.images].sort((a, b) => a.sortOrder - b.sortOrder)
  } catch (error) {
    loadError.value = errorMessage(error)
  } finally {
    loading.value = false
  }
}

function positive(value: string | number): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function validate(): boolean {
  for (const key of Object.keys(errors)) delete errors[key]

  if (form.title.trim().length < 6) errors.title = 'Give the listing a descriptive title'
  if (form.description.trim().length < 20) {
    errors.description = 'Describe the vehicle in at least 20 characters'
  }
  const price = positive(form.priceEur)
  if (price === null || price <= 0) errors.priceEur = 'Enter a price above zero'

  if (!form.makeName.trim()) errors['vehicle.makeName'] = 'Enter the make'
  if (!form.modelName.trim()) errors['vehicle.modelName'] = 'Enter the model'
  if (!form.color.trim()) errors['vehicle.color'] = 'Enter the colour'

  const mileage = positive(form.mileageKm)
  if (mileage === null || mileage < 0) errors['vehicle.mileageKm'] = 'Enter the mileage in km'

  const power = positive(form.powerKw)
  if (power === null || power <= 0) errors['vehicle.powerKw'] = 'Enter the power in kW'

  if (!form.firstRegistration) errors['vehicle.firstRegistration'] = 'Pick the first registration'

  return Object.keys(errors).length === 0
}

function buildPayload(): ListingInput {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    priceEur: Number(form.priceEur),
    vehicle: {
      makeName: form.makeName.trim(),
      modelName: form.modelName.trim(),
      bodyType: form.bodyType,
      fuelType: form.fuelType,
      transmission: form.transmission,
      color: form.color.trim(),
      mileageKm: Number(form.mileageKm),
      powerKw: Number(form.powerKw),
      doors: positive(form.doors),
      seats: positive(form.seats),
      firstRegistration: toIsoDate(form.firstRegistration) as string,
      nextInspection: toIsoDate(form.nextInspection),
    },
  }
}

async function uploadPending(id: number) {
  const queue = [...pending.value]
  pending.value = []
  for (const file of queue) {
    try {
      const uploaded = await api.uploadImage(id, file)
      images.value = [...images.value, uploaded]
    } catch (error) {
      imageError.value = errorMessage(error)
    }
  }
}

async function submit() {
  failure.value = null
  if (!validate()) return
  saving.value = true
  try {
    const payload = buildPayload()
    const detail = isEdit.value
      ? await api.updateListing(listingId.value as number, payload)
      : await api.createListing(payload)
    await uploadPending(detail.id)
    await router.push({ name: 'seller-dashboard' })
  } catch (error) {
    const fieldErrors = fieldErrorsOf(error)
    if (Object.keys(fieldErrors).length) Object.assign(errors, fieldErrors)
    else failure.value = errorMessage(error)
  } finally {
    saving.value = false
  }
}

function addFiles(files: File[]) {
  imageError.value = null
  pending.value = [...pending.value, ...files]
}

function removePending(index: number) {
  pending.value = pending.value.filter((_, i) => i !== index)
}

async function removeImage(id: number) {
  imageError.value = null
  const previous = images.value
  images.value = images.value.filter((image) => image.id !== id)
  try {
    await api.deleteImage(id)
  } catch (error) {
    images.value = previous
    imageError.value = errorMessage(error)
  }
}

onMounted(async () => {
  await loadMeta()
  await loadListing()
})
</script>

<template>
  <div class="shell page form-page">
    <header class="head">
      <RouterLink :to="{ name: 'seller-dashboard' }" class="back">
        <AppIcon name="arrow-left" :size="16" />
        Your listings
      </RouterLink>
      <h1>{{ isEdit ? 'Edit listing' : 'New listing' }}</h1>
      <p class="lead">
        Vehicle facts first, then the words that sell it. Everything is editable later
      </p>
    </header>

    <p v-if="loadError" class="alert alert-error">{{ loadError }}</p>

    <div v-if="loading" class="loading">
      <div class="skeleton block"></div>
      <div class="skeleton block"></div>
    </div>

    <form v-else class="form" novalidate @submit.prevent="submit">
      <section class="step card">
        <header class="step-head">
          <span class="step-index">1</span>
          <div>
            <h2 class="step-title">Vehicle facts</h2>
            <p class="step-note">These drive the filters buyers use</p>
          </div>
        </header>

        <div class="grid">
          <div class="field">
            <label class="field-label" for="make">Make</label>
            <input
              id="make"
              v-model="form.makeName"
              class="input"
              :class="{ 'has-error': errors['vehicle.makeName'] }"
              list="make-options"
              autocomplete="off"
            />
            <datalist id="make-options">
              <option v-for="make in meta?.makes ?? []" :key="make.name" :value="make.name" />
            </datalist>
            <p v-if="errors['vehicle.makeName']" class="field-error">
              {{ errors['vehicle.makeName'] }}
            </p>
          </div>

          <div class="field">
            <label class="field-label" for="model">Model</label>
            <input
              id="model"
              v-model="form.modelName"
              class="input"
              :class="{ 'has-error': errors['vehicle.modelName'] }"
              list="model-options"
              autocomplete="off"
            />
            <datalist id="model-options">
              <option v-for="model in modelSuggestions" :key="model" :value="model" />
            </datalist>
            <p v-if="errors['vehicle.modelName']" class="field-error">
              {{ errors['vehicle.modelName'] }}
            </p>
          </div>

          <div class="field">
            <label class="field-label" for="body">Body type</label>
            <select id="body" v-model="form.bodyType" class="select">
              <option v-for="option in bodyOptions" :key="option" :value="option">
                {{ bodyLabel(option) }}
              </option>
            </select>
          </div>

          <div class="field">
            <label class="field-label" for="fuel">Fuel</label>
            <select id="fuel" v-model="form.fuelType" class="select">
              <option v-for="option in fuelOptions" :key="option" :value="option">
                {{ fuelLabel(option) }}
              </option>
            </select>
          </div>

          <div class="field">
            <label class="field-label" for="transmission">Transmission</label>
            <select id="transmission" v-model="form.transmission" class="select">
              <option v-for="option in transmissionOptions" :key="option" :value="option">
                {{ transmissionLabel(option) }}
              </option>
            </select>
          </div>

          <div class="field">
            <label class="field-label" for="color">Colour</label>
            <input
              id="color"
              v-model="form.color"
              class="input"
              :class="{ 'has-error': errors['vehicle.color'] }"
              type="text"
            />
            <p v-if="errors['vehicle.color']" class="field-error">{{ errors['vehicle.color'] }}</p>
          </div>

          <div class="field">
            <label class="field-label" for="mileage">Mileage in km</label>
            <input
              id="mileage"
              v-model="form.mileageKm"
              class="input"
              :class="{ 'has-error': errors['vehicle.mileageKm'] }"
              type="number"
              min="0"
              step="1"
              inputmode="numeric"
            />
            <p v-if="errors['vehicle.mileageKm']" class="field-error">
              {{ errors['vehicle.mileageKm'] }}
            </p>
          </div>

          <div class="field">
            <label class="field-label" for="power">Power in kW</label>
            <input
              id="power"
              v-model="form.powerKw"
              class="input"
              :class="{ 'has-error': errors['vehicle.powerKw'] }"
              type="number"
              min="1"
              step="1"
            />
            <p v-if="errors['vehicle.powerKw']" class="field-error">
              {{ errors['vehicle.powerKw'] }}
            </p>
            <p v-else class="field-hint">Shown to buyers as kW and PS</p>
          </div>

          <div class="field">
            <label class="field-label" for="doors">Doors</label>
            <input id="doors" v-model="form.doors" class="input" type="number" min="2" max="7" />
          </div>

          <div class="field">
            <label class="field-label" for="seats">Seats</label>
            <input id="seats" v-model="form.seats" class="input" type="number" min="2" max="9" />
          </div>

          <div class="field">
            <label class="field-label" for="registration">First registration</label>
            <input
              id="registration"
              v-model="form.firstRegistration"
              class="input"
              :class="{ 'has-error': errors['vehicle.firstRegistration'] }"
              type="month"
            />
            <p v-if="errors['vehicle.firstRegistration']" class="field-error">
              {{ errors['vehicle.firstRegistration'] }}
            </p>
          </div>

          <div class="field">
            <label class="field-label" for="inspection">Next inspection</label>
            <input id="inspection" v-model="form.nextInspection" class="input" type="month" />
            <p class="field-hint">Leave empty if the HU has expired</p>
          </div>
        </div>
      </section>

      <section class="step card">
        <header class="step-head">
          <span class="step-index">2</span>
          <div>
            <h2 class="step-title">Listing text and price</h2>
            <p class="step-note">What buyers read before they call you</p>
          </div>
        </header>

        <div class="field">
          <label class="field-label" for="title">Title</label>
          <input
            id="title"
            v-model="form.title"
            class="input"
            :class="{ 'has-error': errors.title }"
            type="text"
            placeholder="BMW 3 Series 320d Sport Line"
          />
          <p v-if="errors.title" class="field-error">{{ errors.title }}</p>
        </div>

        <div class="field">
          <label class="field-label" for="price">Price in EUR</label>
          <input
            id="price"
            v-model="form.priceEur"
            class="input price-input"
            :class="{ 'has-error': errors.priceEur }"
            type="number"
            min="1"
            step="1"
            inputmode="numeric"
          />
          <p v-if="errors.priceEur" class="field-error">{{ errors.priceEur }}</p>
        </div>

        <div class="field">
          <label class="field-label" for="description">Description</label>
          <textarea
            id="description"
            v-model="form.description"
            class="textarea"
            :class="{ 'has-error': errors.description }"
            rows="6"
            placeholder="Service history, extras, condition, anything a buyer would ask on the phone"
          ></textarea>
          <p v-if="errors.description" class="field-error">{{ errors.description }}</p>
        </div>
      </section>

      <section class="step card">
        <header class="step-head">
          <span class="step-index">3</span>
          <div>
            <h2 class="step-title">Photos</h2>
            <p class="step-note">The first photo becomes the cover image</p>
          </div>
        </header>

        <ImageUploader
          :images="images"
          :pending="pending"
          :busy="saving"
          :error="imageError"
          @add="addFiles"
          @remove-pending="removePending"
          @remove-image="removeImage"
          @reject="imageError = $event"
        />
      </section>

      <p v-if="failure" class="alert alert-error">{{ failure }}</p>

      <footer class="actions">
        <RouterLink :to="{ name: 'seller-dashboard' }" class="btn btn-secondary btn-lg">
          Cancel
        </RouterLink>
        <button type="submit" class="btn btn-primary btn-lg" :disabled="saving">
          <AppIcon name="check" :size="16" />
          {{ saving ? 'Saving' : isEdit ? 'Save changes' : 'Publish listing' }}
        </button>
      </footer>
    </form>
  </div>
</template>

<style scoped>
.form-page {
  max-width: 940px;
}

.head {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-8);
}

.back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  align-self: flex-start;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-muted);
}

.back:hover {
  color: var(--accent-text);
}

.lead {
  color: var(--text-muted);
}

.loading {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.block {
  height: 240px;
  border-radius: var(--radius-lg);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.step {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-6);
}

.step-head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border);
}

.step-index {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex: none;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent-text);
  font-size: var(--text-sm);
  font-weight: 700;
}

.step-title {
  font-size: var(--text-lg);
  font-weight: 640;
}

.step-note {
  font-size: var(--text-xs);
  color: var(--text-subtle);
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

.price-input {
  max-width: 220px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

@media (min-width: 720px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
